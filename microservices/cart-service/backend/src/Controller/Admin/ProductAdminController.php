<?php
namespace App\Controller\Admin;

use App\Dto\Product\ProductAdminRequestDto;
use App\Service\ProductServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use App\Mapper\ProductMapper;
use App\Mapper\ProductAdminMapper;

#[Route('/api/store/admin/products')]
class ProductAdminController extends AbstractController
{
    public function __construct(
        private readonly ProductServiceInterface $productService,
    ) {}

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $dto = ProductAdminMapper::mapToProductAdminRequestDto($data);
        
        $product = $this->productService->createProduct($dto);
        return $this->json(ProductMapper::mapToResponseDto($product), Response::HTTP_CREATED);
    }

    #[Route('/{productId}', methods: ['PUT'])]
    public function update(string $productId, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $dto = ProductAdminMapper::mapToProductAdminRequestDto($data);
        
        $product = $this->productService->updateProduct(Uuid::fromString($productId), $dto);
        return $this->json(ProductMapper::mapToRseponseDto($product));
    }

    #[Route('/{productId}', methods: ['DELETE'])]
    public function delete(string $productId): JsonResponse
    {
        $this->productService->deleteProduct(Uuid::fromString($productId));
        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    // GET methods use the existing mapper
    #[Route('', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $products = $this->productService->getAllProducts(); 
        return $this->json(ProductMapper::mapCollection($products));
    }
}