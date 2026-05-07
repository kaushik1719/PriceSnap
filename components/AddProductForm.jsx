"use client";   // as we are using hooks overhere they dynamic component should be in client component

import React, { useState } from "react";
import { Input } from "./ui/input";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { AuthModal } from "./AuthModal";
import { addProduct } from "@/app/actions";
import { toast } from "sonner";

const AddProductForm = ({ user }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSubmit = async (e) => {   // API call to add product to database
        e.preventDefault();

        if(!user){
          setShowAuthModal(true);
          return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("url", url);

        const result = await addProduct(formData);

        if (result.error){
          toast.error(result.error);
        }else{
          toast.success(result.message || "Product Tracked successfully!");
          setUrl(""); // Clear input field after successful addition
        }

        setLoading(false);
  };


  return (
    <> 
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Your Product URL Here"
              className="h-12 text-base"
              required
              disabled={loading}
            />

            <Button className="bg-orange-500 hover:bg-orange-600 h-10 sm:h-12 px-8"
                    type="submit"
                    disabled={loading}
                    size={"lg"}
            > 
              {loading ? (
                  <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Adding...
                  </>
                 ) : (
                 "Track Price"
              )}
            </Button>
          </div>
      </form>

    {/* Auth Modal */}
    <AuthModal
               isOpen={showAuthModal}
               onClose={()=> setShowAuthModal(false)}
    />
    
    </>
  )
}
export default AddProductForm;