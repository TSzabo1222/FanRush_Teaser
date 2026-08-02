require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const { issueInvoice } = require('./invoice');
const { validateYoutubeLink } = require('./youtube');


const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();



const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5500';



const MAX_MEDIA_SHARE_SECONDS =
  parseInt(
    process.env.MAX_MEDIA_SHARE_SECONDS || '180',
    10
  );



// Simple in-memory database for the proof of concept.
// Data is lost after restart.
// In production this should be replaced with a real database
// (donation id -> status, invoice number, payment data, etc.)

const donations = new Map();




app.use(
  cors({
    origin: FRONTEND_URL
  })
);





/**
 * IMPORTANT:
 *
 * Stripe webhook signature verification requires the RAW request body.
 *
 * Therefore this route has its own body parser
 * and must be placed BEFORE express.json().
 *
 * If express.json() runs first, Stripe signature verification
 * will always fail.
 */

app.post(

  '/webhook',

  express.raw({
    type:'application/json'
  }),

  async (req,res)=>{


    let event;



    try {


      const signature =
        req.headers['stripe-signature'];



      event =
        stripe.webhooks.constructEvent(

          req.body,

          signature,

          process.env.STRIPE_WEBHOOK_SECRET

        );


    }


    catch(err){


      console.error(
        'Webhook signature verification failed:',
        err.message
      );


      return res
        .status(400)
        .send(
          `Webhook Error: ${err.message}`
        );


    }





    if(event.type === 'checkout.session.completed'){


      const session =
        event.data.object;



      await handleSuccessfulDonation(session);


    }



    // Stripe requires a fast 200 response,
    // otherwise it will resend the event.

    res.json({
      received:true
    });


  }

);







// Normal JSON parser for all other routes.

app.use(express.json());








async function handleSuccessfulDonation(session){



  const meta =
    session.metadata || {};



  // Convert from cents back to HUF.

  const amountHUF =
    session.amount_total / 100;





  const donation = {


    amountHUF,


    buyerName:
      meta.donorName ||
      session.customer_details?.name ||
      '',



    buyerEmail:
      meta.donorEmail ||
      session.customer_details?.email ||
      '',



    message:
      meta.message || '',



    youtubeUrl:
      meta.youtubeUrl || '',



    youtubeVideoId:
      meta.youtubeVideoId || '',



    streamerName:
      process.env.STREAMER_NAME || '',



    orderRef:
      session.id,


  };





  donations.set(

    session.id,

    {

      ...donation,

      status:'paid',

      invoiceNumber:null

    }

  );






  try {


    const result =
      await issueInvoice(donation);




    donations.set(

      session.id,

      {


        ...donation,


        status:'paid',


        invoiceNumber:
          result.invoiceNumber || null,


        invoiceSkipped:
          !!result.skipped,


      }


    );





    console.log(

      result.skipped

      ? `[donation] ${session.id}: paid, invoice skipped (missing agent key)`

      : `[donation] ${session.id}: paid, invoice created (${result.invoiceNumber})`

    );



  }



  catch(err){



    // Payment succeeded.
    // Only invoice generation failed.
    //
    // This must not be silently ignored because
    // the streamer may need to create the invoice manually later.


    console.error(

      `[donation] ${session.id}: invoice error:`,

      err.message

    );



    donations.set(

      session.id,

      {


        ...donation,


        status:'paid_invoice_error',


        error:err.message


      }

    );


  }



}









/**
 * Called when a viewer clicks the "Send Support" button.
 *
 * Creates a Stripe Checkout session and returns
 * the checkout URL for browser redirection.
 */

app.post(

  '/create-checkout-session',

  async(req,res)=>{


    try {



      const {

        amountHUF,

        donorName,

        donorEmail,

        message,

        youtubeUrl


      } = req.body;






      if(!amountHUF || amountHUF < 100){


        return res.status(400).json({

          error:
          'The amount must be at least 100 HUF.'

        });


      }






      if(!donorEmail){


        return res.status(400).json({

          error:
          'Email address is required for invoice creation.'

        });


      }







      /*
        Validate YouTube link BEFORE starting payment.

        This prevents users from paying for an invalid
        or unsupported video.
      */


      const youtubeCheck =
        await validateYoutubeLink(

          youtubeUrl,

          MAX_MEDIA_SHARE_SECONDS

        );




      if(!youtubeCheck.ok){


        return res.status(400).json({

          error:youtubeCheck.error,

          field:'youtubeUrl'


        });


      }









      const session =

        await stripe.checkout.sessions.create({



          mode:'payment',



          payment_method_types:[

            'card'

          ],




          line_items:[


            {


              price_data:{


                currency:'huf',



                product_data:{


                  name:

                  `Support — ${process.env.STREAMER_NAME || 'Streamer'}`,



                  description:

                    message

                    ? `Message: ${message}`

                    : undefined,


                },



                /*
                  Stripe uses the smallest currency unit.

                  Example:
                  2500 HUF => 250000

                  (HUF is zero-decimal for payouts,
                  but card charges use cents internally.)
                */


                unit_amount:

                  Math.round(

                    amountHUF * 100

                  ),


              },


              quantity:1,


            }


          ],






          customer_email:

            donorEmail,






          metadata:{


            donorName:
              donorName || '',



            donorEmail,



            message:
              message || '',



            youtubeUrl:
              youtubeUrl || '',



            youtubeVideoId:
              youtubeCheck.videoId || '',


          },







          success_url:

            `${FRONTEND_URL}/succesful.html?session_id={CHECKOUT_SESSION_ID}`,





          cancel_url:

            `${FRONTEND_URL}/aborted.html`,



        });







      res.json({

        url:session.url

      });





    }





    catch(err){



      console.error(

        'Checkout session creation error:',

        err.message

      );



      res.status(500).json({

        error:

        'Could not start payment.'

      });



    }



  }

);









/**
 * The success page uses this endpoint
 * to check if the webhook has already processed
 * payment and invoice creation.
 *
 * The webhook runs asynchronously,
 * so the frontend may need to wait.
 */

app.get(

  '/donation-status/:sessionId',

  (req,res)=>{



    const donation =

      donations.get(

        req.params.sessionId

      );





    if(!donation){



      return res.json({

        status:'processing'

      });



    }





    res.json(donation);



  }

);







const PORT =
  process.env.PORT || 4242;




app.listen(

  PORT,

  ()=>{


    console.log(

      `FanRush backend running: http://localhost:${PORT}`

    );



    console.log(

      `Stripe webhook test command: stripe listen --forward-to localhost:${PORT}/webhook`

    );


  }

);