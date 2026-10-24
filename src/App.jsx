import React, { useCallback, useEffect, useState } from "react";

const operators = {
  "+": (left, right) => left + right,
  "−": (left, right) => left - right,
  "×": (left, right) => left * right,
  "÷": (left, right) => left / right,
};

const formatResult = (value) => {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  return String(Number.parseFloat(value.toPrecision(12)));
};

const keypad = [
  { label: "AC", action: "clear", style: "utility" },
  { label: "±", action: "sign", style: "utility" },
  { label: "÷", action: "operator", style: "operator" },
  { label: "⌫", action: "backspace", style: "utility" },
  { label: "7", action: "digit" },
  { label: "8", action: "digit" },
  { label: "9", action: "digit" },
  { label: "×", action: "operator", style: "operator" },
  { label: "4", action: "digit" },
  { label: "5", action: "digit" },
  { label: "6", action: "digit" },
  { label: "−", action: "operator", style: "operator" },
  { label: "1", action: "digit" },
  { label: "2", action: "digit" },
  { label: "3", action: "digit" },
  { label: "+", action: "operator", style: "operator" },
  { label: "0", action: "digit", style: "zero" },
  { label: ".", action: "decimal" },
  { label: "=", action: "equals", style: "equals" },
];

function App() {
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState("");

  const clear = useCallback(() => {
    setDisplay("0");
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  }, []);

  const enterDigit = useCallback((digit) => {
    if (display === "Error") {
      setDisplay(digit);
      setExpression("");
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      if (storedValue === null) {
        setExpression("");
      }
      return;
    }

    setDisplay((current) => (current === "0" ? digit : current + digit));
  }, [display, storedValue, waitingForOperand]);

  const enterDecimal = useCallback(() => {
    if (display === "Error") {
      setDisplay("0.");
      setExpression("");
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      if (storedValue === null) {
        setExpression("");
      }
      return;
    }

    if (!display.includes(".")) {
      setDisplay(`${display}.`);
    }
  }, [display, storedValue, waitingForOperand]);

  const chooseOperator = useCallback((nextOperator) => {
    if (display === "Error") {
      return;
    }

    const currentValue = Number(display);
    if (operator && !waitingForOperand) {
      const result = formatResult(operators[operator](storedValue, currentValue));
      setDisplay(result);
      if (result === "Error") {
        setStoredValue(null);
        setOperator(null);
        setWaitingForOperand(true);
        setExpression("");
        return;
      }
      setStoredValue(Number(result));
      setExpression(`${result} ${nextOperator}`);
    } else if (operator && waitingForOperand) {
      setExpression(`${storedValue} ${nextOperator}`);
    } else {
      setStoredValue(currentValue);
      setExpression(`${display} ${nextOperator}`);
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
  }, [display, operator, storedValue, waitingForOperand]);

  const calculate = useCallback(() => {
    if (!operator || storedValue === null || waitingForOperand || display === "Error") {
      return;
    }

    const result = formatResult(operators[operator](storedValue, Number(display)));
    setExpression(`${storedValue} ${operator} ${display} =`);
    setDisplay(result);
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [display, operator, storedValue, waitingForOperand]);

  const toggleSign = useCallback(() => {
    if (display === "Error" || Number(display) === 0) {
      return;
    }
    setDisplay((current) => (current.startsWith("-") ? current.slice(1) : `-${current}`));
  }, [display]);

  const backspace = useCallback(() => {
    if (display === "Error") {
      clear();
      return;
    }
    if (waitingForOperand) {
      return;
    }
    setDisplay((current) => {
      const shortened = current.length > 1 ? current.slice(0, -1) : "0";
      return shortened === "-" ? "0" : shortened;
    });
  }, [clear, display, waitingForOperand]);

  const handleAction = useCallback((action, value) => {
    if (action === "digit") enterDigit(value);
    if (action === "decimal") enterDecimal();
    if (action === "operator") chooseOperator(value);
    if (action === "equals") calculate();
    if (action === "clear") clear();
    if (action === "sign") toggleSign();
    if (action === "backspace") backspace();
  }, [backspace, calculate, chooseOperator, clear, enterDecimal, enterDigit, toggleSign]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        enterDigit(event.key);
      } else if (event.key === ".") {
        event.preventDefault();
        enterDecimal();
      } else if (["+", "-", "*", "/"].includes(event.key)) {
        event.preventDefault();
        const symbol = { "+": "+", "-": "−", "*": "×", "/": "÷" }[event.key];
        chooseOperator(symbol);
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (event.key === "Escape" || event.key === "Delete") {
        event.preventDefault();
        clear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [backspace, calculate, chooseOperator, clear, enterDecimal, enterDigit]);

  return (
    <main className="page">
      <section className="calculator" aria-label="Calculator">
        <header className="calculator-header">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">+</span>
            <span>CALCULATOR</span>
          </div>
          <span className="header-caption">BASIC MODE</span>
        </header>

        <div className="display-panel" aria-live="polite" aria-atomic="true">
          <div className="expression">{expression || "\u00a0"}</div>
          <output className="display-value" aria-label="Display">{display}</output>
        </div>

        <div className="keypad">
          {keypad.map(({ label, action, style = "" }) => (
            <button
              className={`key ${style}`}
              key={label}
              type="button"
              onClick={() => handleAction(action, label)}
              aria-label={
                label === "AC" ? "Clear all"
                  : label === "⌫" ? "Backspace"
                    : label === "±" ? "Toggle sign"
                      : label === "÷" ? "Divide"
                        : label === "×" ? "Multiply"
                          : label === "−" ? "Subtract"
                            : label === "+" ? "Add"
                              : label === "=" ? "Equals"
                                : label
              }
            >
              {label}
            </button>
          ))}
        </div>
        <footer className="calculator-footer">Use your keyboard for quick calculations</footer>
      </section>
    </main>
  );
}

export default App;
