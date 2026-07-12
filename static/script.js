let chartInstance = null;

async function predictStock() {
    const symbol = document.getElementById("symbolInput").value.trim();
    if (!symbol) {
        alert("Please enter a stock symbol.");
        return;
    }

    document.getElementById("loading").style.display = "block";
    document.getElementById("resultBox").style.display = "none";
    document.getElementById("errorMsg").style.display = "none";
    document.getElementById("predictBtn").disabled = true;

    try {
        const response = await fetch(`/predict/${symbol}`);
        const data = await response.json();

        document.getElementById("loading").style.display = "none";
        document.getElementById("predictBtn").disabled = false;

        if (!data.recent_prices || data.message !== "Success") {
            document.getElementById("errorMsg").textContent = data.message || "Something went wrong.";
            document.getElementById("errorMsg").style.display = "block";
            return;
        }

        const lastClose = data.recent_prices[data.recent_prices.length - 1];
        const predicted = data.predicted_price;

        document.getElementById("predictedPrice").textContent = "$" + predicted.toFixed(2);
        document.getElementById("lastPrice").textContent = "$" + lastClose.toFixed(2);

        const trendEl = document.getElementById("trend");
        if (predicted > lastClose) {
            trendEl.textContent = "↑ UP";
            trendEl.style.color = "#16a34a";
        } else {
            trendEl.textContent = "↓ DOWN";
            trendEl.style.color = "#dc2626";
        }

        document.getElementById("resultBox").style.display = "block";

        drawChart(data.dates, data.recent_prices, predicted);

    } catch (err) {
        document.getElementById("loading").style.display = "none";
        document.getElementById("predictBtn").disabled = false;
        document.getElementById("errorMsg").textContent = "Network error. Make sure the server is running.";
        document.getElementById("errorMsg").style.display = "block";
    }
}

function drawChart(dates, prices, predicted) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const nextDate = "Next Day";
    const allDates = [...dates, nextDate];
    const historicalData = [...prices, null];
    const predictedData = new Array(prices.length).fill(null);
    predictedData.push(predicted);

    const ctx = document.getElementById("myChart").getContext("2d");
    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: allDates,
            datasets: [
                {
                    label: "Closing Price",
                    data: historicalData,
                    borderColor: "#2563eb",
                    backgroundColor: "rgba(37, 99, 235, 0.08)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2,
                    spanGaps: false
                },
                {
                    label: "Predicted Price",
                    data: predictedData,
                    borderColor: "#f97316",
                    backgroundColor: "rgba(249, 115, 22, 0.1)",
                    pointRadius: 6,
                    pointBackgroundColor: "#f97316",
                    tension: 0.3,
                    spanGaps: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top"
                },
                title: {
                    display: true,
                    text: "Recent Closing Prices + Prediction"
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 10
                    }
                },
                y: {
                    ticks: {
                        callback: val => "$" + val.toFixed(2)
                    }
                }
            }
        }
    });
}

document.getElementById("symbolInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") predictStock();
});
