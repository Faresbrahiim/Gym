<?php

namespace App\Controller;

use App\Mapper\ProductMapper;
use App\Service\ProductServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/products')]
final class ProductController extends AbstractController
{
    public function __construct(
        private readonly ProductServiceInterface $productService,
    ) {}

    #[Route('', name: 'app_product_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        try {
            $products = $this->productService->getAllProducts();
            return $this->json(ProductMapper::mapCollection($products), Response::HTTP_OK);
        } catch (\Exception $e) {
            error_log('Product list error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return $this->json(
                ['error' => 'Failed to load products', 'message' => $e->getMessage()],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
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

        return $this->json(ProductMapper::mapToResponseDto($product));
    }

    #[Route('/{productId}/image', methods: ['GET'])]
    public function getImage(string $productId): Response
    {
        try {
            $uuid = Uuid::fromString($productId);
            $product = $this->productService->getProduct($uuid);
            
            if (!$product || !$product->getImageData()) {
                // Return a default placeholder image
                $defaultImage = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
                return new Response(
                    $defaultImage,
                    Response::HTTP_OK,
                    ['Content-Type' => 'image/png']
                );
            }
            
            $imageData = base64_decode($product->getImageData());
            $mimeType = $product->getImageMimeType() ?: 'image/jpeg';
            
            return new Response(
                $imageData,
                Response::HTTP_OK,
                ['Content-Type' => $mimeType]
            );
            
        } catch (\Exception $e) {
            error_log('Error loading image: ' . $e->getMessage());
            return new Response('', Response::HTTP_NOT_FOUND);
        }
    }
}