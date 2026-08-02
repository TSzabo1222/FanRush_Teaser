
const BACKEND_URL = 'http://localhost:4242';



function formatFt(n) {

    return Number(n).toLocaleString('en-US') + ' HUF';

}




function showState(id) {

    document.querySelectorAll('.state')
        .forEach(el => el.classList.remove('active'));

    document.getElementById(id)
        .classList.add('active');

}




async function pollStatus(sessionId, attemptsLeft = 12) {


    try {


        const res =
            await fetch(`${BACKEND_URL}/donation-status/${sessionId}`);


        const data =
            await res.json();




        if (data.status === 'processing') {


            if (attemptsLeft <= 0) {

                showState('state-error');

                return;

            }


            setTimeout(
                () => pollStatus(sessionId, attemptsLeft - 1),
                1000
            );


            return;


        }





        document.getElementById('s-amount').textContent =
            formatFt(data.amountHUF);


        document.getElementById('s-name').textContent =
            data.buyerName || 'Anonymous supporter';


        document.getElementById('s-streamer').textContent =
            data.streamerName || '—';


        document.getElementById('s-email').textContent =
            data.buyerEmail || '—';




        document.getElementById('invoice-ready').style.display = 'none';

        document.getElementById('invoice-pending').style.display = 'none';

        document.getElementById('invoice-error').style.display = 'none';




        if (data.status === 'paid_invoice_error') {


            document.getElementById('invoice-error')
                .style.display = 'flex';


        }

        else if (data.invoiceSkipped) {


            document.getElementById('invoice-pending')
                .style.display = 'flex';


        }

        else {


            document.getElementById('s-invoice-num')
                .textContent = data.invoiceNumber || '—';


            document.getElementById('invoice-ready')
                .style.display = 'flex';


        }



        showState('state-success');


    }



    catch (err) {

        console.error(err);

        showState('state-error');

    }


}





const params =
    new URLSearchParams(window.location.search);


const sessionId =
    params.get('session_id');




if (!sessionId) {

    showState('state-error');

}

else {

    pollStatus(sessionId);

}

