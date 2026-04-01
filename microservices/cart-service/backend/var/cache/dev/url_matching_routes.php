<?php

/**
 * This file has been auto-generated
 * by the Symfony Routing Component.
 */

return [
    false, // $matchHost
    [ // $staticRoutes
        '/api/store/products' => [[['_route' => 'app_product_list', '_controller' => 'App\\Controller\\ProductController::list'], null, ['GET' => 0], null, true, false, null]],
        '/api/store/products/search' => [[['_route' => 'app_product_search', '_controller' => 'App\\Controller\\ProductController::search'], null, ['GET' => 0], null, false, false, null]],
    ],
    [ // $regexpList
        0 => '{^(?'
                .'|/_error/(\\d+)(?:\\.([^/]++))?(*:35)'
                .'|/api/store/products/([^/]++)(*:70)'
            .')/?$}sDu',
    ],
    [ // $dynamicRoutes
        35 => [[['_route' => '_preview_error', '_controller' => 'error_controller::preview', '_format' => 'html'], ['code', '_format'], null, null, false, true, null]],
        70 => [
            [['_route' => 'app_product_show', '_controller' => 'App\\Controller\\ProductController::show'], ['productId'], ['GET' => 0], null, false, true, null],
            [null, null, null, null, false, false, 0],
        ],
    ],
    null, // $checkCondition
];
