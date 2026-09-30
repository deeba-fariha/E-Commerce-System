// Product Catalog Data
let productsData = [
 
];




async function loadProductsFromAPI() {

    try {

        const data = await apiFetch(
            "/api/products/approved"
        );


        const sellerProducts = data.map(product => ({

            // avoid conflict with hardcoded IDs
            id: product.id,


            name: product.name,


            category: product.category,


            categoryName:
                product.category_name ||
                product.category,


            price:
                Number(product.price),


            oldPrice:
                product.old_price
                ? Number(product.old_price)
                : null,


            rating:
                Number(product.rating || 0),


            reviewsCount:
                product.reviews_count || 0,


            badge:
                product.badge || "New",


            badgeType:
                product.badge_type || "orange",


            image:
                product.image
                ? apiAssetUrl(product.image)
                : "https://via.placeholder.com/700",


            description:
                product.description,


            inStock:
                product.in_stock

        }));


        // ADD database products with existing products
        productsData = [
            ...productsData,
            ...sellerProducts
        ];


        console.log(
            "Products loaded:",
            productsData
        );


        // refresh homepage
        filterAndRenderProducts();


    } catch(error) {


        const message = apiErrorMessage(
            error,
            "Could not load products."
        );

        if (typeof showToast === "function") {
            showToast(message);
        }


    }

}