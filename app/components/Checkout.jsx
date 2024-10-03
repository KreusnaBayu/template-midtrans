import React, { useState, useEffect } from "react";
import { product } from "../libs/product";

const Checkout = () => {
  const [quantity, setQuantity] = useState(1);
  const [snapLoaded, setSnapLoaded] = useState(false); // State to check if snap is loaded
  const [snapToken, setSnapToken] = useState(null); // State to store the generated Snap token
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk2NzEwZDgzLWU1OTQtNDVjYy05NWY0LWRhYTdhNWMyMDIxZSIsImlhdCI6MTcyNzkyOTUxMSwiZXhwIjoxNzU5NDY1NTExfQ.zjY40tgk8q0mSvQoAbEnzTDZxu3giH8YJQC8ebNup_c"; // Replace with your actual hardcoded token

  // Dynamically load Midtrans Snap.js when the component mounts
  useEffect(() => {
    const snapScript = document.createElement("script");
    snapScript.src = "https://app.sandbox.midtrans.com/snap/snap.js"; // Sandbox environment
    snapScript.setAttribute("data-client-key", process.env.NEXT_PUBLIC_CLIENT); // Replace with your client key
    snapScript.async = true;

    snapScript.onload = () => {
      console.log("Midtrans Snap.js script loaded successfully");
      setSnapLoaded(true); // Update state when loaded
    };

    document.body.appendChild(snapScript);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      document.body.removeChild(snapScript);
    };
  }, []);

  // Adjust quantity with bounds
  const adjustQuantity = (amount) => {
    setQuantity((prevQuantity) => Math.max(1, prevQuantity + amount));
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
        },
      ],
    };

    try {
      const response = await fetch("http://localhost:3000/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Ensure headers for JSON
          Authorization: `Bearer ${token}`, // Include the hardcoded token in the headers
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }

      const requestData = await response.json();
      console.log("Midtrans Response:", requestData); // Log the response for debugging

      // Store the Snap token for later use
      setSnapToken(requestData.body.token); // Store token received from the response

      // Ensure Midtrans Snap is loaded and token is available
      if (snapLoaded && window.snap && requestData.body.token) {
        window.snap.pay(requestData.body.token, {
          // Optional callbacks
          onSuccess: async function (result) {
            console.log("Payment success:", result);
            alert("Payment successful!");

            // Send the Midtrans response to the backend to save in Firestore
            const saveResponse = await fetch("http://localhost:3000/save-transaction", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: "USER_ID", // Replace with the actual user ID
                transactionData: {
                  order_id: result.order_id,
                  transaction_id: result.transaction_id,
                  gross_amount: result.gross_amount,
                  currency: result.currency,
                  payment_type: result.payment_type,
                  transaction_time: result.transaction_time,
                  transaction_status: result.transaction_status,
                  expiry_time: result.expiry_time || null,
                  qr_string: result.qr_string,
                  qris_url: result.qris_url,
                  finish_redirect_url: result.finish_redirect_url,
                  finish_200_redirect_url: result.finish_200_redirect_url,
                }, // Pass the payment result to save
              }),
            });

            if (!saveResponse.ok) {
              const errorText = await saveResponse.text();
              console.error(`Failed to save transaction data: ${errorText}`);
            } else {
              console.log("Transaction data saved successfully.");
            }
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
      } else {
        throw new Error("Midtrans Snap is not loaded or token is missing");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("An error occurred during checkout. Please try again.");
    }
  };

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
            const value = Math.max(1, Number(e.target.value)); // Ensure quantity is at least 1
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
