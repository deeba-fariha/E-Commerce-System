/* ============ CART DATA ============ */

const cart = [
  { name:"Ceramic Pour-Over Coffee Set", qty:1, price:1450 },
  { name:"Bamboo Cutting Board Set", qty:2, price:980 },
  { name:"Matte Lipstick — Terracotta", qty:1, price:650 },
];

const SHIPPING_FLAT = 60;
let discount = 0;
let appliedCode = null;

const money = n => "৳" + n.toLocaleString("en-IN");
const initials = name => name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();

function subtotal(){
  return cart.reduce((sum,item)=>sum + item.price*item.qty, 0);
}

function total(){
  return Math.max(subtotal() + SHIPPING_FLAT - discount, 0);
}


/* ============ PAYMENT PROVIDER (STRIPE TEST MODE) ============ */

// This is Stripe's own public example key — safe to expose in frontend code.
// It only ever creates test-mode PaymentMethods; it cannot move real money
// and it cannot see or confirm charges (that needs a secret key on a server).

const STRIPE_TEST_PUBLISHABLE_KEY = "pk_test_TYooMQauvdEDq54NiTphI7jx";

const stripe = window.Stripe ? Stripe(STRIPE_TEST_PUBLISHABLE_KEY) : null;
const elements = stripe ? stripe.elements() : null;
let cardElement = null;

function mountCardElement(){
  if(!stripe || cardElement) return;

  cardElement = elements.create("card", {
    style: {
      base: {
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        fontSize: "13.5px",
        color: "#1B1D22",
        "::placeholder": { color: "#9CA0AA" }
      },
      invalid: { color: "#C1553D" }
    }
  });

  cardElement.mount("#card-element");

  cardElement.on("change", (event)=>{
    document.getElementById("card-errors").textContent =
      event.error ? event.error.message : "";
  });
}


/* ============ STEP NAVIGATION ============ */

let currentStep = 1;

function goToStep(step){
  document.querySelectorAll(".step-panel").forEach(p=>p.classList.remove("active"));

  const panel = document.getElementById("panel-" + step);
  if(panel) panel.classList.add("active");

  document.querySelectorAll(".step").forEach(s=>{
    const n = Number(s.dataset.step);
    s.classList.toggle("active", n === step);
    s.classList.toggle("done", n < step);
  });

  currentStep = step;
  window.scrollTo({top:0, behavior:"smooth"});
}


/* ----- Step 1 -> 2 ----- */

document.getElementById("toStep2").addEventListener("click", ()=>{
  const method = document.querySelector('input[name="method"]:checked').value;

  if(method === "cod"){
    runPipeline("cod");
  } else {
    configureStep2(method);
    goToStep(2);
  }
});


/* ----- Step 2: adapt form to payment method ----- */

function configureStep2(method){
  const brand = document.getElementById("cardBrand");
  const label = document.getElementById("payBtnLabel");
  const cardForm = document.getElementById("cardForm");
  const sandboxNote = document.getElementById("sandboxNote");
  const cardPreview = document.querySelector(".card-preview");

  if(method === "card"){
    brand.textContent = "CARD";

    document.getElementById("panel-2")
      .querySelector(".panel-title")
      .textContent = "Enter card details";

    document.getElementById("panel-2")
      .querySelector(".panel-sub")
      .textContent =
        "This is Stripe's test sandbox — no real card is charged.";

    sandboxNote.style.display = "block";

    cardForm.innerHTML = `
      <label class="span-2">Name on card
        <input type="text" id="cardName" placeholder="Farhana Islam">
        <span class="field-error" id="errCardName"></span>
      </label>

      <label class="span-2">Card details
        <div id="card-element" class="stripe-element"></div>
        <span class="field-error" id="card-errors"></span>
      </label>`;

    mountCardElement();

    document.getElementById("cardName").addEventListener("input", (e)=>{
      document.getElementById("cardPreviewName").textContent =
        e.target.value.trim().toUpperCase() || "FULL NAME";
    });

    cardPreview.style.display = "flex";

  } else {

    const walletName = method === "bkash" ? "bKash" : "Nagad";

    brand.textContent = walletName.toUpperCase();

    document.getElementById("panel-2")
      .querySelector(".panel-title")
      .textContent =
        `Confirm your ${walletName} payment`;

    document.getElementById("panel-2")
      .querySelector(".panel-sub")
      .textContent =
        `Enter the ${walletName} number you'll pay from, then confirm with your PIN.`;

    sandboxNote.style.display = "block";

    sandboxNote.innerHTML =
      `Sandbox mode — this demo simulates ${walletName}'s test environment (no live wallet API key is wired up here).`;

    cardForm.innerHTML = `
      <label class="span-2">${walletName} number
        <input type="tel" id="walletNumber"
          placeholder="01XXXXXXXXX"
          inputmode="numeric"
          maxlength="11">

        <span class="field-error" id="errWalletNumber"></span>
      </label>

      <label class="span-2">${walletName} PIN
        <input type="password" id="walletPin"
          placeholder="••••"
          inputmode="numeric"
          maxlength="5">

        <span class="field-error" id="errWalletPin"></span>
      </label>`;

    cardPreview.style.display = "none";
  }

  label.innerHTML =
    `Pay <span id="payAmount">${money(total())}</span>`;
}


/* ----- Step 2 -> back / pay ----- */

document.getElementById("backTo1")
  .addEventListener("click", ()=>goToStep(1));


document.getElementById("payNowBtn")
  .addEventListener("click", ()=>{

    const method =
      document.querySelector('input[name="method"]:checked').value;

    if(method === "card"){

      const name =
        document.getElementById("cardName").value.trim();

      if(!validateField(
        name.length > 1,
        "errCardName",
        "Enter the name on the card"
      )) return;

      runPipeline("card", { name });

    } else {

      const walletNumber =
        document.getElementById("walletNumber").value.trim();

      const walletPin =
        document.getElementById("walletPin").value.trim();

      let valid = true;

      valid =
        validateField(
          /^01\d{9}$/.test(walletNumber),
          "errWalletNumber",
          "Enter a valid 11-digit number"
        ) && valid;

      valid =
        validateField(
          walletPin.length >= 4,
          "errWalletPin",
          "Enter your PIN"
        ) && valid;

      if(!valid) return;

      runPipeline(method, {
        last4: walletNumber.slice(-4)
      });
    }
  });


/* ============ FIELD VALIDATION ============ */

function validateField(condition, errId, message){
  const el = document.getElementById(errId);

  if(!el) return true;

  el.textContent =
    condition ? "" : message;

  return condition;
}


/* ============ PAYMENT PIPELINE ============ */

// Walks through:
// Customer -> Your website -> Payment API -> Payment provider ->
// Customer authorizes -> Payment success -> Your website confirms order.
//
// Stage 3 makes a REAL call to Stripe's test sandbox for the "card" method.
// Everything else is simulated, since confirming a charge needs a secret key
// on a server, which this frontend-only build intentionally doesn't have.

const STAGE_SETS = {
  card: [1,2,3,4,5,6,7],
  bkash: [1,2,3,4,5,6,7],
  nagad: [1,2,3,4,5,6,7],
  cod:  [1,2,7],
};


async function runPipeline(method, detail = {}){

  const overlay =
    document.getElementById("pipelineOverlay");

  const footnote =
    document.getElementById("pipelineFootnote");

  const steps =
    document.querySelectorAll(".pipe-step");

  const activeStages =
    STAGE_SETS[method];

  steps.forEach(s=>{
    s.classList.remove(
      "active",
      "done",
      "error"
    );

    s.style.display =
      activeStages.includes(
        Number(s.dataset.pipe)
      )
        ? "flex"
        : "none";
  });

  footnote.textContent = "";

  overlay.classList.add("open");


  /* ----- Pipeline text ----- */

  document.getElementById("pipeDetail3").textContent =
    method === "card"
      ? "Calling Stripe.js — real sandbox request"
      : `Calling ${
          method === "bkash"
            ? "bKash"
            : "Nagad"
        } sandbox API (simulated)`;


  document.getElementById("pipeDetail4").textContent =
    method === "card"
      ? "Stripe validates the card in test mode"
      : `${
          method === "bkash"
            ? "bKash"
            : "Nagad"
        } validates the wallet in sandbox`;


  const setStage = (n, cls)=>{
    const el =
      document.querySelector(
        `.pipe-step[data-pipe="${n}"]`
      );

    if(el) el.classList.add(cls);
  };


  const wait =
    ms => new Promise(
      r => setTimeout(r, ms)
    );


  let paymentMethodId = null;


  /* ----- RUN PIPELINE ----- */

  for(const stage of activeStages){

    setStage(stage, "active");


    if(stage === 3 && method === "card"){

      if(!stripe || !cardElement){

        const errorElement =
          document.getElementById("card-errors");

        if(errorElement){
          errorElement.textContent =
            "Payment system is not available.";
        }

        setStage(stage, "error");

        footnote.textContent =
          "Stripe could not be initialized.";

        await wait(1400);

        overlay.classList.remove("open");

        return;
      }


      /* ----- REAL STRIPE TEST REQUEST ----- */

      const result =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: detail.name
          }
        });


      if(result.error){

        const errorElement =
          document.getElementById("card-errors");

        if(errorElement){
          errorElement.textContent =
            result.error.message;
        }

        setStage(stage, "error");

        footnote.textContent =
          "Card declined in sandbox — fix the details and try again.";

        await wait(1400);

        overlay.classList.remove("open");

        return;
      }


      paymentMethodId =
        result.paymentMethod.id;

    } else {

      await wait(
        stage === 1
          ? 450
          : 650
      );
    }


    const stageElement =
      document.querySelector(
        `.pipe-step[data-pipe="${stage}"]`
      );

    if(stageElement){
      stageElement.classList.remove("active");
      setStage(stage, "done");
    }
  }


  footnote.textContent =
    paymentMethodId
      ? `Stripe test PaymentMethod created: ${paymentMethodId}`
      : "Stages 2–6 are simulated here — wire this up to your real backend when ready.";


  await wait(600);

  overlay.classList.remove("open");


  finalizeOrder(
    method,
    {
      ...detail,
      paymentMethodId
    }
  );
}


/* ============ FINALIZE ORDER ============ */

function finalizeOrder(method, detail = {}){

  const methodNames = {
    card: "Card",
    bkash: "bKash",
    nagad: "Nagad",
    cod: "Cash on delivery"
  };


  const txnId =
    detail.paymentMethodId ||
    (
      "TXN-" +
      Math.floor(
        100000 +
        Math.random() * 900000
      )
    );


  const orderNo =
    "#" +
    Math.floor(
      10000 +
      Math.random() * 90000
    );


  const now = new Date();


  /* ----- PAYMENT SUCCESSFUL ----- */

  document.getElementById("successAmount")
    .textContent =
      money(total());


  document.getElementById("txnId")
    .textContent =
      txnId;


  document.getElementById("txnMethod")
    .textContent =
      methodNames[method] +
      (
        detail.last4
          ? ` ending in ${detail.last4}`
          : ""
      );


  document.getElementById("txnDate")
    .textContent =
      now.toLocaleString(
        "en-GB",
        {
          dateStyle:"medium",
          timeStyle:"short"
        }
      );


  if(method === "cod"){

    document.getElementById("panel-3")
      .querySelector(".panel-title")
      .textContent =
        "Order placed";


    document.getElementById("panel-3")
      .querySelector(".panel-sub")
      .innerHTML =
        `You'll pay <strong>${money(total())}</strong> in cash when your order arrives.`;

  } else {

    document.getElementById("panel-3")
      .querySelector(".panel-title")
      .textContent =
        "Payment successful";


    document.getElementById("panel-3")
      .querySelector(".panel-sub")
      .innerHTML =
        `Your payment of <strong>${money(total())}</strong> has been received.`;
  }


  /* ----- ORDER CONFIRMATION ----- */

  document.getElementById("orderNumber")
    .textContent =
      orderNo;


  document.getElementById("confirmEta")
    .textContent =
      estimateDelivery();


  document.getElementById("confirmTotal")
    .textContent =
      money(total());


  /* Payment successful = STEP 3 */

  goToStep(3);
}


/* ============ DELIVERY ESTIMATE ============ */

function estimateDelivery(){

  const d = new Date();

  d.setDate(
    d.getDate() + 3
  );

  return d.toLocaleDateString(
    "en-GB",
    {
      weekday:"long",
      day:"numeric",
      month:"long"
    }
  );
}


/* ----- STEP 3 -> STEP 2 ----- */

document.getElementById("backTo2")
  .addEventListener(
    "click",
    () => goToStep(2)
  );


/* ----- STEP 3 -> STEP 4 ----- */

document.getElementById("toStep4")
  .addEventListener(
    "click",
    () => goToStep(4)
  );


/* ----- STEP 4 actions ----- */

document.getElementById("newOrderBtn")
  .addEventListener("click", ()=>{
    window.location.href = "/main/index.html";
  });


/* ============ TOAST ============ */

function showToast(msg){

  let toast =
    document.getElementById(
      "checkoutToast"
    );


  if(!toast){

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "checkoutToast";


    toast.style.cssText = `
      position:fixed;
      bottom:24px;
      left:50%;
      transform:translateX(-50%) translateY(20px);
      background:#161A23;
      color:#fff;
      padding:11px 20px;
      border-radius:8px;
      font-size:13px;
      opacity:0;
      pointer-events:none;
      transition:.2s ease;
      z-index:200;
      max-width:90vw;
      text-align:center;
    `;


    document.body.appendChild(
      toast
    );
  }


  toast.textContent =
    msg;


  toast.style.opacity =
    "1";


  toast.style.transform =
    "translateX(-50%) translateY(0)";


  clearTimeout(
    showToast._t
  );


  showToast._t =
    setTimeout(()=>{

      toast.style.opacity =
        "0";

      toast.style.transform =
        "translateX(-50%) translateY(20px)";

    }, 2600);
}


/* ============ INIT ============ */

goToStep(1);