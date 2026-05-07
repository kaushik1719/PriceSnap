// // We will create a cron job that runs every hour to check the prices of the products and send notifications to the users if the price has dropped below their desired price.

// import { sendPriceDropAlert } from "@/lib/email";
// import { scrapeProduct } from "@/lib/firecrawl";
// import { createClient } from "@supabase/supabase-js";
// import { NextResponse } from "next/server";

// export async function GET() {
//     return NextResponse.json({ 
//         message: "Price check endpoint is working. Use POST to trigger."
//      });
// }

// export async function POST() {
//      try {
//         const authHeader = request.headers.get("authorization");
//         const cronSecret = process.env.CRON_SECRET;

//         if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
//             return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//         }
       
//         // Use service role to bypass RLS  // SUPABASE_SERVICE_ROLE_KEY is very crucial and dont share it with anyone
//         const supabase = createClient(
//             process.env.NEXT_PUBLIC_SUPABASE_URL,
//             process.env.SUPABASE_SERVICE_ROLE_KEY
//         )

//         const { data: products, error: productsError } = await supabase
//             .from("products")
//             .select("*");

//         if (productsError) throw productsError;
//           console.log(`Found ${products.length} products to check.`);
    
//         const results = {
//             total: products.length,
//             updated: 0,
//             failed: 0,
//             priceChanges: 0,
//             alertsSent: 0,
//         };    

//         for (const product of products) {
//             try {
//                   const productData = await scrapeProduct(product.url);
                  
//                   if(!productData.currentPrice) 
//                   {
//                     results.failed++;
//                     continue;
//                   }

//                   const newPrice = parseFloat(productData.currentPrice);
//                   const oldPrice = parseFloat(product.current_price);

//                   await supabase.from("products").update({
//                     current_price: newPrice,
//                     currency: productData.currencyCode || product.currency,
//                     name: productData.productName || product.name,
//                     image_url: productData.productImageUrl || product.image_url,
//                     updated_at: new Date().toISOString(),
//                   })
//                   .eq("id", product.id)


//                   if(oldPrice !== newPrice) 
//                    {
//                       await supabase.from("price_history").insert({
//                            product_id: product.id,
//                            price: newPrice,
//                            currency: productData.currencyCode || product.currency,
//                          });
//                      results.priceChanges++;
//                    }

//                   if(newPrice < oldPrice)
//                   {
//                      // Alert
//                      const{
//                          data: { user },
//                      } = await supabase.auth.admin.getUserById(product.user_id);



//                      if (user?.email){
//                         // send email to user.email about price drop (Service called Resend)

//                         const emailResult = await sendPriceDropAlert(
//                             user.email,
//                             product,
//                             oldPrice,
//                             newPrice
//                         );
//                      }
//                    }
                   
//                    results.updated++;

//                 }catch (error) {
//                     console.error(`Error Processing product ${product.id}:`, error);
//                     results.failed++;
//                 }
//         }

//         return NextResponse.json({
//             success:true,
//             message: "Price check completed",
//             results,
//         })
//      } catch (error) {
//         console.error("Cron job Error:", error);
//         return NextResponse.json({ error: error.message }, { status: 500 });
//      }
// }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/email";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    console.log(`Found ${products.length} products to check`);

    const results = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products) 
    {
      try {
        const productData = await scrapeProduct(product.url);

        if (!productData.currentPrice) {
          results.failed++;
          continue;
        }

        const newPrice = parseFloat(productData.currentPrice);
        const oldPrice = parseFloat(product.current_price);

        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency: productData.currencyCode || product.currency,
            name: productData.productName || product.name,
            image_url: productData.productImageUrl || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (oldPrice !== newPrice) 
        {
          await supabase.from("price_history").insert({
            product_id: product.id,
            price: newPrice,
            currency: productData.currencyCode || product.currency,
          });

          results.priceChanges++;

          if (newPrice < oldPrice) 
          {
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);

            if (user?.email) 
            {
              const emailResult = await sendPriceDropAlert(
                user.email,
                product,
                oldPrice,
                newPrice
              );

              if (emailResult.success) 
                {
                 results.alertsSent++;
                }
            }
          }
        }

        results.updated++;
      } 
      catch (error) 
      {
        console.error(`Error processing product ${product.id}:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Price check completed",
      results,
    });
  } 
  catch (error) 
  {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Price check endpoint is working. Use POST to trigger.",
  });
}