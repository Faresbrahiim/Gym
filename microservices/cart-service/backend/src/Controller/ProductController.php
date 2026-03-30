<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use App\Service\ProductService;
use Symfony\Component\HttpFoundation\Response;

#[Route('/api/store/products')]
final class ProductController extends AbstractController
{
    // 1. Define a private property to hold the service
    private ProductService $productService;

    // 2. Inject it via the constructor
    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    #[Route('/', name: 'app_product_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $products = $this->productService->getAllProducts();

        if (!$products) {
            // You could return an empty array with a 200 OK
            return $this->json([], Response::HTTP_OK);
            
        }

        return $this->json($products);
    }
    #[Route('/search', name: 'app_product_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $query = $request->query->get('productName', '');
        
        if (empty($query)) {
            return $this->json(['error' => 'Search query is required'], 400);
        }

        $products = $this->productService->searchProducts($query);
        
        return $this->json($products);
    }

    // URL: GET /api/store/products/5
    #[Route('/{productId}', name: 'app_product_show', methods: ['GET'])]
    public function show(int $productId): JsonResponse
    {
        $product = $this->productService->getProduct($productId);

        if (!$product) {
            throw $this->createNotFoundException('Product not found');
        }

        return $this->json($product);
    }
}
