<?php

namespace App\Controller\Admin;

use App\Service\ProductServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use App\Mapper\ProductMapper;

#[Route('/admin/products')]
class ProductAdminController extends AbstractController
{
    public function __construct(
        private readonly ProductServiceInterface $productService,
    ) {}

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            // Get data from form-data (not JSON)
            $name = $request->request->get('name');
            $description = $request->request->get('description');
            $price = $request->request->get('price');
            $status = $request->request->get('status', 'AVAILABLE');
            $image = $request->files->get('image');
            
            // Validate required fields
            if (!$name || !$price) {
                return $this->json(['error' => 'Name and price are required'], Response::HTTP_BAD_REQUEST);
            }
            
            error_log('Files received: ' . json_encode($request->files->keys()));
            error_log('Is image present: ' . ($image ? 'YES' : 'NO'));
            
            // Create product using the direct method
            $product = $this->productService->createProductDirect(
                name: $name,
                description: $description,
                price: $price,
                status: $status,
                image: $image
            );
            
            return $this->json(ProductMapper::mapToResponseDto($product), Response::HTTP_CREATED);
            
        } catch (\InvalidArgumentException $e) {
            error_log('Create product validation error: ' . $e->getMessage());
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            error_log('Create product error: ' . $e->getMessage());
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{productId}', methods: ['PUT'])]
    public function update(string $productId, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            $product = $this->productService->updateProduct(
                Uuid::fromString($productId), 
                $data['name'],
                $data['description'] ?? null,
                $data['price']
            );
            
            return $this->json(ProductMapper::mapToResponseDto($product));
            
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{productId}', methods: ['DELETE'])]
    public function delete(string $productId): JsonResponse
    {
        try {
            $this->productService->deleteProduct(Uuid::fromString($productId));
            return $this->json(null, Response::HTTP_NO_CONTENT);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $products = $this->productService->getAllProducts(); 
        return $this->json(ProductMapper::mapCollection($products));
    }

    #[Route('/{productId}/status', methods: ['PATCH'])]
    public function updateStatus(string $productId, Request $request): JsonResponse
    {
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
            $uuid = Uuid::fromString($productId);
            $product = $this->productService->getProduct($uuid);
            
            if (!$product || !$product->getImageData()) {
                return new Response('', Response::HTTP_NOT_FOUND);
            }
            
            $imageData = base64_decode($product->getImageData());
            $mimeType = $product->getImageMimeType() ?: 'image/jpeg';
            
            return new Response(
                $imageData,
                Response::HTTP_OK,
                ['Content-Type' => $mimeType]
            );
            
        } catch (\Exception $e) {
            return new Response('', Response::HTTP_NOT_FOUND);
        }
    }
}