<?php
namespace App\Controller;

use App\Mapper\ProductMapper;
use App\Service\ProductServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/store/products')]
final class ProductController extends AbstractController
{
    public function __construct(
        private readonly ProductServiceInterface $productService,
    ) {}

    #[Route('', name: 'app_product_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $products = $this->productService->getAllProducts();

        // Single Responsibility: Mapper handles the transformation
        return $this->json(
            ProductMapper::mapCollection($products), 
            Response::HTTP_OK
        );
    }

    #[Route('/search', name: 'app_product_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $query = $request->query->get('productName', '');
        
        if (empty($query)) {
            return $this->json(['error' => 'Search query is required'], Response::HTTP_BAD_REQUEST);
        }

        $products = $this->productService->searchProducts($query);
        
        return $this->json(ProductMapper::mapCollection($products));
    }

    #[Route('/{productId}', name: 'app_product_show', methods: ['GET'])]
    public function show(string $productId): JsonResponse
    {
        try {
            $uuid = Uuid::fromString($productId);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => 'Invalid UUID format'], Response::HTTP_BAD_REQUEST);
        }

        $product = $this->productService->getProduct($uuid);

        if (!$product) {
            return $this->json(['error' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        // Dependency Inversion: Using the injected mapper
        return $this->json(ProductMapper::mapToResponseDto($product));
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

            return $this->json($this->productMapper->mapToResponseDto($product));
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }
}