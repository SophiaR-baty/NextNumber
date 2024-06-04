const reroll_attempts = 3;
const MAX_NUMBERS = 6;

window.addEventListener('error', (event) => {
    console.error('MathJax error:', event.error);
});

document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const values = urlParams.get('values');

    if (values) {
        document.getElementById('numbers').value = values;
        // document.getElementById('inputForm').submit();
    }
});


const functionss = [
    {
        "name": "linear",
        "latex": "x",
        "parameters": []
    },
    {
        "name": "polynomial",
        "latex": "x^{${a}}",
        "parameters": 
        [
            { "name": "a", "min": -5, "max": 5, "exclude": [ 0, 1 ] }
        ]
    },
    {
        "name": "constant",
        "latex": "1",
        "parameters": []
    },
    {
        "name": "sine",
        "latex": "\\sin(${a}\\cdot x)",
        "parameters": 
        [
            { "name": "a", "min": -20, "max": 20, "exclude": [] }
        ]
    },
    {
        "name": "cosine",
        "latex": "\\cos(${a}\\cdot x)",
        "parameters": 
        [
            { "name": "a", "min": -20, "max": 20, "exclude": [] }
        ]
    },
    {
        "name": "tangent",
        "latex": "\\tan(${a}\\cdot x)",
        "parameters": 
        [
            { "name": "a", "min": -20, "max": 20, "exclude": [] }
        ]
    },
    {
        "name": "exponential", 
        "latex": "${a}^{x}",
        "parameters":
        [
            { "name": "a", "min": 0.1, "max": 5, "exclude": [ 0, 1 ] }
        ]
    },
    {
        "name": "factorial",
        "latex": "x!",
        "parameters": []
    }
];

const functionDict = {
    "linear": (x, param) => x, 
    "polynomial": (x, param) => x ** param[0].value, 
    "constant": (x, param) => 1, 
    "sine": (x, param) => Math.sin(param[0].value * x), 
    "cosine": (x, param) => Math.cos(param[0].value * x), 
    "tangent": (x, param) => Math.tan(param[0].value * x), 
    "exponential": (x, param) => param[0].value ** x, 
    "factorial": (x, param) => factorial(x), 
};

function handleSubmit(event) {
    // prevents default behavior
    event.preventDefault();

    // define html elements
    const predictionResult = document.getElementById('predictionResult');
    const graphContainer = document.getElementById('plot');

    // get numbers from input
    const numbersInput = document.getElementById('numbers').value.trim().split(' ').map(Number);

    // check if all entered numbers are valid
    if (numbersInput.some(isNaN)) {
        predictionResult.textContent = "Please enter valid numbers separated by space.";
        return;
    }

    // check if at least numbers
    if (numbersInput.length < 2) {
        predictionResult.textContent = "Please enter at least two numbers for prediction.";
        return;
    }

    // check if max numbers is surpassed
    if (numbersInput.length > MAX_NUMBERS) {
        predictionResult.textContent = "Please enter no more than " + String(MAX_NUMBERS) + " numbers for prediction. ";
        return;
    } 

    // Select n random functions where n is the number of user numbers
    const n = numbersInput.length;
    
    const selectedFunctions = [];
    const selectedIndices = [];
    for (var i = 0; i < n;) {
        // roll function type
        var randomIndex = Math.floor(Math.random() * functionss.length);
        
        // reroll function if same function is already used
        var attempt = 0;
        while (selectedIndices.includes(randomIndex) && attempt < reroll_attempts) {
            randomIndex = Math.floor(Math.random() * functionss.length);
        }

        // set function type and roll parameters
        var f = functionss[randomIndex];
        
        var func = {
            func: functionDict[f["name"]], 
            param: [],
            latex: f["latex"]
        };
        
        for (var pi = 0; pi < f["parameters"].length; pi++) {
            // get min and max values and excludes
            var mini = f["parameters"][pi]["min"];
            var maxi = f["parameters"][pi]["max"];
            var excludes = f["parameters"][pi]["exclude"];

            var p_value = mini + (maxi-mini) * Math.random();

            // reroll parameter if not valid
            while (excludes.includes(p_value)) { 
                p_value = mini + (maxi-mini) * Math.random();
            }
            
            func.param.push({ "name": f["parameters"][pi]["name"], "value": p_value});
        }

        // push function and random index
        selectedFunctions.push(func);
        selectedIndices.push(randomIndex);
        i++;
    }
    delete selectedIndices;

    // calculation step
    // Create the n by n matrix A by applying selected functions to user numbers
	const matrixA = [];
    for (let i = 1; i <= n; i++) {
        const row = [];
        selectedFunctions.forEach((func) => {
            row.push(func.func(i, func.param));
        });
        matrixA.push(row);
    }
    // Calculate the inverse of matrix A
    const matrixAInverse = math.inv(matrixA);
    // Create vector v from user numbers
    const vectorV = numbersInput.slice();
    // Calculate the coefficients for selected functions
    const coefficients = math.multiply(matrixAInverse, vectorV);

    // Generate the prediction function in LaTeX
    let predictionLatex = "f(x) = ";
    selectedFunctions.forEach((func, index) => {
        predictionLatex += `${coefficients[index]} \\cdot ${formatLatex(func)} + `;
    });
    predictionLatex = predictionLatex.slice(0, -3); // Remove the extra " + " at the end
    predictionLatex = convertScientificToLatex(predictionLatex);

    let predictionLatex_short = "f(x) = ";
    selectedFunctions.forEach((func, index) => {
        predictionLatex_short += `${coefficients[index].toFixed(2)} \\cdot ${formatLatexShort(func)} + `;
    });
    predictionLatex_short = predictionLatex_short.slice(0, -3); // Remove the extra " + " at the end

    // Calculate the next value using the predicted function
    const nextValue = math.multiply(coefficients, selectedFunctions.map(func => func.func(numbersInput.length + 1, func.param)));

    // Display the prediction result
    predictionResult.innerHTML = '';

    var paragraph1 = document.createElement('p');
    paragraph1.innerHTML = "Predicted Function: <br><br>$" + predictionLatex_short + "$";
    predictionResult.appendChild(paragraph1);
    
    var paragraph2 = document.createElement('p');
    paragraph2.innerHTML = "Predicted next value: <br><br>$" + nextValue + "$";
    predictionResult.appendChild(paragraph2);

    MathJax.typesetPromise()

    var minVal = Math.min.apply(null, numbersInput);
    minVal = Math.min(0, nextValue, minVal) - 3;
    var maxVal = Math.max.apply(null, numbersInput);
    maxVal = Math.max(0, nextValue, maxVal) + 3;
    // plotting the function
    altGraph(graphContainer, predictionLatex, minVal, maxVal);
}

document.getElementById('inputForm').addEventListener('submit', function(event) {
    handleSubmit(event);
});


function formatLatex(func) {
    var latex_str = func.latex;
    func.param.forEach((p) => {
        latex_str = latex_str.replace("${" + p["name"] + "}", String(p["value"]));
    });

    return latex_str;
}

function formatLatexShort(func) {
    var latex_str = func.latex;
    func.param.forEach((p) => {
        latex_str = latex_str.replace("${" + p["name"] + "}", String(p["value"].toFixed(2)));
    });

    return latex_str;
}

function convertScientificToLatex(scientificStr) {
    const pattern = /([-+]?\d*\.?\d+)[eE]([-+]?\d+)/g;
    const replacement = '$1\\cdot 10^{$2}';
    return scientificStr.replace(pattern, replacement);
}

function factorial(n) {
    if (n < 0) return undefined; // Factorial is not defined for negative numbers
    let result = 1;
    for (let i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}

function calculate(funcs, coeff, x) {
    var result = 0;

    for (var i = 0; i < funcs.length; i++) {
        result += coeff[i] * funcs[i].func(x, funcs[i].param)
    }

    return result;
}


function altGraph(destination, latex_str, minVal, maxVal, num_points=10) {
    destination.innerHTML = "";
    // initiallize calculator
    const options = {
        keypad: false,
        expressions: false,
        settingsMenu: false,
        // lockViewport: true,
        pointsOfInterest: false,
        zoomButtons: true,
        trace: false,
        authorFeatures: true
    }
    calculator = Desmos.GraphingCalculator(destination, options);

    // add function
    const f = {
        latex: latex_str,
        color: Desmos.Colors.BLUE
    };
    calculator.setExpression(f);

    // add points
    var p_latex = "[";
    for (var i = 0; i < num_points; i++) {
        p_latex += "(" + String(i+1) + ", f(" + String(i+1) + ")), ";
    }
    p_latex += "(" + String(num_points) + ", f(" + String(num_points) +"))]"
    const points = {
        latex: p_latex,
        showLabel: true,
        style: Desmos.Styles.CROSS,
        color: Desmos.Colors.RED
    };
    calculator.setExpression(points);
    
    // set bounds
    calculator.setMathBounds({
        left: 0,
        right: num_points + 1,
        bottom: minVal,
        top: maxVal
    });
}