// -----------------------------
// FanRush main.js
// -----------------------------

const amountBtns = document.querySelectorAll('.amount-btn');
const customAmt = document.getElementById('custom-amt');
const submitBtn = document.getElementById('submit-btn');

const prevAmt = document.getElementById('prev-amt');
const prevName = document.getElementById('prev-name');
const nameInput = document.getElementById('name-input');

const emailInput = document.getElementById('email-input');
const messageInput = document.getElementById('msg-input');

const BACKEND_URL = "http://localhost:4242";

let currentAmount = 2500;


// -----------------------------
// Format amount
// -----------------------------

function formatHUF(amount) {
    return amount.toLocaleString('en-US') + " HUF";
}


// -----------------------------
// Update amount
// -----------------------------

function updateAmount(amount) {

    currentAmount = amount;

    submitBtn.textContent =
        `Send Support ^0^ - ${formatHUF(amount)}`;


    if (prevAmt) {
        prevAmt.textContent = formatHUF(amount);
    }

}



// -----------------------------
// Amount buttons
// -----------------------------

amountBtns.forEach(btn => {

    btn.addEventListener("click", () => {


        amountBtns.forEach(b =>
            b.classList.remove("active")
        );


        btn.classList.add("active");


        customAmt.value = "";


        updateAmount(
            Number(btn.dataset.amt)
        );


    });

});




// -----------------------------
// Custom amount
// -----------------------------

customAmt.addEventListener("input", () => {


    amountBtns.forEach(b =>
        b.classList.remove("active")
    );


    const value = Number(customAmt.value);


    if (value > 0) {

        updateAmount(value);

    }


});




// -----------------------------
// Name preview
// -----------------------------

nameInput.addEventListener("input", () => {


    if (prevName) {

        prevName.textContent =
            nameInput.value.trim() || "—";

    }


});




// -----------------------------
// Stripe checkout
// -----------------------------

submitBtn.addEventListener("click", async () => {


    if (!emailInput.value.trim()) {


        emailInput.focus();

        emailInput.style.borderColor = "red";

        return;


    }



    submitBtn.disabled = true;

    submitBtn.textContent = "Processing...";



    try {


        const response = await fetch(
            `${BACKEND_URL}/create-checkout-session`,
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },


                body: JSON.stringify({

                    amountHUF: currentAmount,


                    donorName:
                        nameInput.value.trim(),


                    donorEmail:
                        emailInput.value.trim(),


                    message:
                        messageInput.value.trim(),


                    youtubeUrl: ""

                })

            }
        );



        const data = await response.json();



        if (!response.ok || !data.url) {


            throw new Error(
                data.error ||
                "Could not start payment."
            );


        }



        // Redirect to Stripe

        window.location.href = data.url;



    }


    catch(error) {


        console.error(error);


        alert(
            "Payment error: " + error.message
        );


        submitBtn.disabled = false;


        submitBtn.textContent =
            `Send Support ^0^ - ${formatHUF(currentAmount)}`;


    }



});




// Initial state

updateAmount(2500);