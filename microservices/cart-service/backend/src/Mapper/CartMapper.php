<?php
namespace App\Mapper;

use App\Entity\Cart;
use App\Dto\Cart\CartResponseDto;
use App\Dto\Cart\CartItemResponseDto;

class CartMapper
{
    public static function mapToResponseDto(Cart $cart): CartResponseDto
    {
        $items = [];
        $total = 0;

        foreach ($cart->getItems() as $item) {
            $product = $item->getProduct();
            $price = (float)$product->getPrice();
            
            $items[] = new CartItemResponseDto(
                id: $item->getId()->toRfc4122(),
                productId: $product->getId()->toRfc4122(),
                productName: $product->getName(),
                price: (float)$product->getPrice(),
                quantity: $item->getQuantity(),
                // Add these additional fields
                productImage: $product->getImagePath(),
                productDescription: $product->getDescription(),
                productStatus: $product->getStatus()
            );
            
            $total += $price * $item->getQuantity();
        }

        return new CartResponseDto(
            id: $cart->getId()->toRfc4122(),
            items: $items,
            totalPrice: (float)$total
        );
    }
}