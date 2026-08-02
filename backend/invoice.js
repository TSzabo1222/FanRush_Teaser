/**
 * Small client for the Számlázz.hu Invoice Agent XML API.
 *
 * Official documentation: https://docs.szamlazz.hu/agent
 *
 * The request is a multipart/form-data POST request sent to:
 * https://www.szamlazz.hu/szamla/
 *
 * The XML file must be attached in a file field named:
 * "action-xmlagentxmlfile"
 *
 * IMPORTANT:
 * Before using this with a production API key, it is recommended to
 * validate the generated XML against the XSD schema provided by Számlázz.hu:
 *
 * docs.szamlazz.hu/agent/generating_invoice/xml
 *
 * The API may silently reject requests if the XML structure does not
 * exactly match the required schema.
 */


const axios = require('axios');
const FormData = require('form-data');


const SZAMLAZZ_URL = 'https://www.szamlazz.hu/szamla/';



function escapeXml(str = '') {

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

}



function todayISO() {

  return new Date().toISOString().slice(0, 10);

}



/**
 * Creates the invoice XML document.
 *
 * @param {Object} donation
 *
 * @param {number} donation.amountHUF
 * Gross amount in Hungarian Forints.
 * Example: 2500
 *
 * @param {string} donation.buyerName
 * Customer name.
 *
 * @param {string} donation.buyerEmail
 * Customer email address.
 *
 * @param {string} [donation.message]
 * Support message added to the invoice comment.
 *
 * @param {string} [donation.streamerName]
 * Name of the streamer receiving the support.
 * Added to the invoice comment.
 *
 * @param {string} [donation.orderRef]
 * Unique transaction identifier.
 * Example: Stripe checkout session ID.
 *
 * Used for invoice tracking and preventing duplicate invoice creation.
 */
function buildInvoiceXml(donation) {


  const {

    amountHUF,

    buyerName,

    buyerEmail,

    message = '',

    streamerName = '',

    orderRef = '',

  } = donation;



  const today = todayISO();



  const comment = [

    streamerName
      ? `Support: ${streamerName}`
      : null,

    message
      ? `Message: ${message}`
      : null,

  ]

  .filter(Boolean)

  .join(' | ');




  /*
    For HUF transactions, net and gross values are currently identical.

    This assumes that the service is VAT-exempt
    (for example, AAM status) or that VAT is not charged.

    If the business is VAT registered, this section must be updated:
    - VAT rate
    - net amount calculation
    - gross amount calculation
    - VAT calculation
  */


}



/**
 * Creates an invoice through Számlázz.hu.
 *
 * If the agent key is not configured, invoice generation is skipped.
 *
 * This allows payment testing with Stripe without requiring
 * invoice generation to be configured.
 */
async function issueInvoice(donation) {


  if (!process.env.SZAMLAZZHU_AGENT_KEY) {


    console.log(

      '[szamlazz.hu] SZAMLAZZHU_AGENT_KEY is missing — invoice creation skipped.',

      donation

    );


    return {

      skipped:true

    };


  }



  /*
    The XML is generated and sent as a multipart/form-data request
    to the Számlázz.hu Invoice Agent API.
  */


}