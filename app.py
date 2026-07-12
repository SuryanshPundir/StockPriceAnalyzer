from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import yfinance as yf
import numpy as np
from sklearn.linear_model import LinearRegression

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/predict/{symbol}")
def predict(symbol: str):
    try:
        ticker = yf.Ticker(symbol.upper())
        df = ticker.history(period="120d")

        if df.empty or len(df) < 10:
            return {"message": "No data found for this symbol", "symbol": symbol}

        closes = df["Close"].tolist()
        dates = [str(d.date()) for d in df.index]

        X = []
        y = []
        lookback = 5

        for i in range(lookback, len(closes)):
            X.append(closes[i - lookback:i])
            y.append(closes[i])

        X = np.array(X)
        y = np.array(y)

        model = LinearRegression()
        model.fit(X, y)

        last_window = np.array(closes[-lookback:]).reshape(1, -1)
        predicted = float(model.predict(last_window)[0])

        recent_prices = [round(p, 2) for p in closes[-30:]]
        recent_dates = dates[-30:]

        return {
            "symbol": symbol.upper(),
            "predicted_price": round(predicted, 2),
            "recent_prices": recent_prices,
            "dates": recent_dates,
            "message": "Success"
        }

    except Exception as e:
        return {"message": f"Error: {str(e)}", "symbol": symbol}