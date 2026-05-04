<?php

namespace App\Controller\Admin;

use App\Mapper\ProductMapper;
use App\Security\JwtUserExtractor;
use App\Service\ProductServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/admin/products')]
class ProductAdminController extends AbstractController
{
    public function __construct(
        private readonly ProductServiceInterface $productService,
        private readonly JwtUserExtractor $jwtUserExtractor,
    ) {}

    private function requireAdmin(Request $request): ?JsonResponse
    {
        if ($this->jwtUserExtractor->extractRole($request) !== 'ADMIN') {
            return $this->json(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

    #[Route('', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        if ($guard = $this->requireAdmin($request)) {
            return $guard;
        }

        $products = $this->productService->getAllProducts();
        return $this->json(ProductMapper::mapCollection($products));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        if ($guard = $this->requireAdmin($request)) {
            return $guard;
        }

        try {
            $name        = $request->request->get('name');
            $description = $request->request->get('description');
            $price       = $request->request->get('price');
            $stockQuantity = (int) $request->request->get('stockQuantity', 0);
            $status      = $request->request->get('status', 'AVAILABLE');
            $image       = $request->files->get('image');

            if (!$name || !$price) {
                return $this->json(['error' => 'Name and price are required'], Response::HTTP_BAD_REQUEST);
            }

            $product = $this->productService->createProductDirect(
                name: $name,
                description: $description,
                price: $price,
                status: $status,
                stockQuantity: $stockQuantity,
                image: $image
            );

            return $this->json(ProductMapper::mapToResponseDto($product), Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{productId}', methods: ['PUT'])]
    public function update(string $productId, Request $request): JsonResponse
    {
        if ($guard = $this->requireAdmin($request)) {
            return $guard;
        }

        try {
            $data = json_decode($request->getContent(), true);

            $product = $this->productService->updateProduct(
                Uuid::fromString($productId),
                $data['name'],
                $data['description'] ?? null,
                $data['price'],
                $data['status'] ?? 'AVAILABLE',
                (int) ($data['stockQuantity'] ?? 0)
            );

            return $this->json(ProductMapper::mapToResponseDto($product));
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{productId}', methods: ['DELETE'])]
    public function delete(string $productId, Request $request): JsonResponse
    {
        if ($guard = $this->requireAdmin($request)) {
            return $guard;
        }

        try {
            $this->productService->deleteProduct(Uuid::fromString($productId));
            return $this->json(null, Response::HTTP_NO_CONTENT);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{productId}/status', methods: ['PATCH'])]
    public function updateStatus(string $productId, Request $request): JsonResponse
    {
        if ($guard = $this->requireAdmin($request)) {
            return $guard;
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['status'])) {
            return $this->json(['error' => 'Status field is required'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $product = $this->productService->updateStatus(
                Uuid::fromString($productId),
                $data['status']
            );

            return $this->json(ProductMapper::mapToResponseDto($product));
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{productId}/image', methods: ['GET'])]
    public function getImage(string $productId): Response
    {
        try {
            $uuid    = Uuid::fromString($productId);
            $product = $this->productService->getProduct($uuid);

            if (!$product || !$product->getImageData()) {
                return new Response('', Response::HTTP_NOT_FOUND);
            }

            return new Response(
                base64_decode($product->getImageData()),
                Response::HTTP_OK,
                ['Content-Type' => $product->getImageMimeType() ?: 'image/jpeg']
            );
        } catch (\Exception $e) {
            return new Response('', Response::HTTP_NOT_FOUND);
        }
    }
}
