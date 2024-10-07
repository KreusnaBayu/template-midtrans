import React, { useState, useEffect } from "react";
import { product } from "../libs/product";

const Checkout = () => {
  const [quantity, setQuantity] = useState(1);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [snapToken, setSnapToken] = useState(null);
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk2NzEwZDgzLWU1OTQtNDVjYy05NWY0LWRhYTdhNWMyMDIxZSIsImlhdCI6MTcyODIyOTE4NCwiZXhwIjoxNzU5NzY1MTg0fQ.6zr_MSJmy0IVUVoUZxtuCVHDOArNmLEyuh8TvWbdrD4"; // Use environment variable for security

  useEffect(() => {
    const snapScript = document.createElement("script");
    snapScript.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    snapScript.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_CLIENT_KEY
    );
    snapScript.async = true;

    snapScript.onload = () => {
      console.log("Midtrans Snap.js script loaded successfully");
      setSnapLoaded(true);
    };

    document.body.appendChild(snapScript);

    return () => {
      document.body.removeChild(snapScript);
    };
  }, []);

  const adjustQuantity = (amount) => {
    setQuantity((prevQuantity) => Math.max(1, prevQuantity + amount));
  };

  const checkout = async () => {
    const data = {
      gross_amount: product.price * quantity,
      email: "customer@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "1234567890",
      items: [
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
        },
      ],
    };

    try {
      const response = await fetch("https://d5bd-160-19-226-254.ngrok-free.app/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`
        );
      }

      const requestData = await response.json();
      console.log("Midtrans Response:", requestData);

      // Correctly access the token
      const snapToken = requestData.body.token; // Accessing token correctly
      console.log("Snap Token:", snapToken);
      setSnapToken(snapToken); // Store token received from the response

    } catch (error) {
      console.error("Error during checkout:", error);
      alert("An error occurred during checkout. Please try again.");
    }
  };

  // New effect to handle snap payment only when both snapToken and snapLoaded are ready
  useEffect(() => {
    if (snapLoaded && snapToken) {
      window.snap.pay(snapToken, {
        onSuccess: function (result) {
          console.log("Payment success:", result);
          alert("Payment successful!");
        },
        onPending: function (result) {
          console.log("Payment pending:", result);
          alert("Waiting for payment...");
        },
        onError: function (result) {
          console.error("Payment failed:", result);
          alert("Payment failed!");
        },
        onClose: function () {
          alert("Payment popup closed without finishing the transaction.");
        },
      });
    }
  }, [snapLoaded, snapToken]);

  return (
    <div className="flex flex-col items-center justify-between">
      <div className="flex sm:gap-4">
        <button
          className="transition-all hover:opacity-75"
          onClick={() => adjustQuantity(-1)}
        >
          ➖
        </button>
        <input
          type="number"
          id="quantity"
          value={quantity}
          className="h-10 w-16 text-black border-transparent text-center"
          onChange={(e) => {
            const value = Math.max(1, Number(e.target.value));
            setQuantity(value);
          }}
        />
        <button
          className="transition-all hover:opacity-75"
          onClick={() => adjustQuantity(1)}
        >
          ➕
        </button>
      </div>

      <button
        className="mt-4 rounded bg-indigo-500 p-4 text-sm font-medium transition hover:scale-105"
        onClick={checkout}
      >
        Checkout
      </button>
    </div>
  );
};

export default Checkout;
