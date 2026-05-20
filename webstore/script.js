        function updateTotal() {
          const robux = parseFloat(document.getElementById("robuxInput").value) || 0;
          const rate = parseFloat(document.getElementById("currency").value);
          const fee = parseFloat(document.getElementById("payment").value);

          const currencyText = document.getElementById("currency").selectedOptions[0].text;

          let total = robux * rate + fee;

          if (currencyText.includes("USD")) {
            document.getElementById("totalText").innerText =
              "Total = $" + total.toFixed(2);
            document.getElementById("feeText").innerText =
              "eCheck Fee = $" + fee.toFixed(2);
          } else {
            document.getElementById("totalText").innerText =
              "Total = Rp " + total.toLocaleString("id-ID");
            document.getElementById("feeText").innerText =
              "eCheck Fee = Rp " + fee.toLocaleString("id-ID");
          }
        }

        /* ✅ Wait until page loads */
        document.addEventListener("DOMContentLoaded", function () {
          document.getElementById("robuxInput").addEventListener("input", updateTotal);
          document.getElementById("currency").addEventListener("change", updateTotal);
          document.getElementById("payment").addEventListener("change", updateTotal);

          updateTotal();
        });
