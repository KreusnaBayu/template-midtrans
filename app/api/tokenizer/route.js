import React, { useState, useEffect } from "react";
import { product } from "../libs/product";

const Checkout = () => {
  const [quantity, setQuantity] = useState(1);

  // Dynamically load Midtrans Snap.js when the component mounts
  useEffect(() => {
    const snapScript = document.createElement("script");
    snapScript.src = "https://app.sandbox.midtrans.com/snap/snap.js"; // Make sure you use the correct environment
    snapScript.setAttribute("data-client-key", process.env.NEXT_PUBLIC_CLIENT); // Replace with your client key
    snapScript.async = true;
    document.body.appendChild(snapScript);

    return () => {
      document.body.removeChild(snapScript); // Cleanup on unmount
    };
  }, []);

  const decreaseQuantity = () => {
    setQuantity((prevState) => (quantity > 1 ? prevState - 1 : prevState));
  };

  const increaseQuantity = () => {
    setQuantity((prevState) => prevState + 1);
  };

  const checkout = async () => {
    const data = {
      gross_amount: product.price * quantity,
      email: "customer@example.com", // Replace with actual data
      firstName: "John", // Replace with actual data
      lastName: "Doe", // Replace with actual data
      phone: "1234567890", // Replace with actual data
      items: [
        {
          id: product.id,
          name: product.name, // Ensure product name is passed correctly
          price: product.price,
          quantity: quantity,
        }
      ]
    };

    try {
      const response = await fetch("/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Ensure headers for JSON
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }

      const requestData = await response.json();

      // Ensure Midtrans Snap is loaded
      if (window.snap && requestData.token) {
        // Pass the token to Midtrans Snap to open the payment popup
        window.snap.pay(requestData.token, {
          // Optional callbacks
          onSuccess: function(result) {
            console.log("Payment success:", result);
            alert("Payment successful!");
          },
          onPending: function(result) {
            console.log("Payment pending:", result);
            alert("Waiting for payment...");
          },
          onError: function(result) {
            console.error("Payment failed:", result);
            alert("Payment failed!");
          },
          onClose: function() {
            alert("Payment popup closed without finishing the transaction.");
          }
        });
      } else {
        throw new Error("Midtrans Snap is not loaded or token is missing");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex sm:gap-4">
          <button
            className="transition-all hover:opacity-75"
            onClick={decreaseQuantity}
          >
            ➖
          </button>

          <input
            type="number"
            id="quantity"
            value={quantity}
            className="h-10 w-16 text-black border-transparent text-center"
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value)); // Ensure quantity is at least 1
              setQuantity(value);
            }}
          />

          <button
            className="transition-all hover:opacity-75"
            onClick={increaseQuantity}
          >
            ➕
          </button>
        </div>
        <button
          className="rounded bg-indigo-500 p-4 text-sm font-medium transition hover:scale-105"
          onClick={checkout}
        >
          Checkout
        </button>
      </div>
    </>
  );
};

export default Checkout;
