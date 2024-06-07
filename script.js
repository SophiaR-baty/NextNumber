// constants
const REROLL_ATTEMPTS = 3;
const MAX_NUMBERS = 6;

// html elements
const div_resultContainer = document.getElementById('resultContainer');
const div_graphContainer = document.getElementById('graphContainer');
const input_numbersInputTextfield = document.getElementById('numbersInputTextfield');
const button_submitButton = document.getElementById("submitButton");


const FUNCTIONS = [
    {
        name: "linear",
        latex: "x",
        evaluate: (x, param) => x,
        parameters: []
    },
    {
        name: "polynomial",
        latex: "x^{${a}}",
        evaluate: (x, param) => x ** param[0].value, 
        parameters: 
        [
            { "name": "a", "type": "number", "min": 0, "max": 5, "exclude": [ 0, 1 ] }
        ]
    },
    {
        name: "constant",
        latex: "1",
        evaluate: (x, param) => 1, 
        parameters: []
    },
    {
        name: "sine",
        latex: "\\sin(${a}\\cdot x)",
        evaluate: (x, param) => Math.sin(param[0].value * x), 
        parameters: 
        [
            { "name": "a", "type": "number", "min": -20, "max": 20, "exclude": [] }
        ]
    },
    {
        name: "cosine",
        latex: "\\cos(${a}\\cdot x)",
        evaluate: (x, param) => Math.cos(param[0].value * x), 
        parameters: 
        [
            { "name": "a", "type": "number", "min": -20, "max": 20, "exclude": [] }
        ]
    },
    {
        name: "tangent",
        latex: "\\tan(${a}\\cdot x)",
        evaluate: (x, param) => Math.tan(param[0].value * x), 
        parameters: 
        [
            { "name": "a", "type": "number", "min": -20, "max": 20, "exclude": [] }
        ]
    },
    {
        name: "exponential", 
        latex: "${a}^{x}",
        evaluate: (x, param) => param[0].value ** x, 
        parameters:
        [
            { "name": "a", "type": "number", "min": 0.1, "max": 5, "exclude": [ 0, 1 ] }
        ]
    },
    {
        name: "factorial",
        latex: "x!",
        evaluate: (x, param) => factorial(x), 
        parameters: []
    },
    {
        name: "reciprocal", 
        latex: "\\frac{1}{${a}}",
        evaluate: (x, param) => 1/param[0].value.func(x, param[0].value.param), 
        parameters:
        [
            { "name": "a", "type": "function", "exclude": [ "constant", "reciprocal" ] }
        ]
    },
    {
        name: "natural_log",
        latex: "\\ln(x)",
        evaluate: (x, param) => Math.log(x), 
        parameters: 
        []
    }
];

window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const values = urlParams.get('numbers');

    if (values) {
        console.log("numbers: " + String(values));
        input_numbersInputTextfield.value = values;
        handleSubmit(null);
    }
});

button_submitButton.onclick = function(event) {
    handleSubmit(event);
};

function selectFunction(idx) {
    // set f to be the function object
    let f = FUNCTIONS[idx];
            
    let func = {
        func: f.evaluate, 
        param: [],
        latex: f.latex
    };

    for (let p_i = 0; p_i < f.parameters.length; p_i++) {
        if (f.parameters[p_i]["type"] == "number") {
            // get min and max values and excludes
            let mini = f.parameters[p_i]["min"];
            let maxi = f.parameters[p_i]["max"];
            let excludes = f.parameters[p_i]["exclude"];

            // get random value for parameter 
            let p_value = mini + (maxi-mini) * Math.random();

            // reroll parameter if not valid
            while (excludes.includes(p_value)) { 
                p_value = mini + (maxi-mini) * Math.random();
            }
            
            // add parameter to parameterlist
            func.param.push({ "name": f.parameters[p_i]["name"], "type": "number", "value": p_value});
        }
        else if (f.parameters[p_i]["type"] == "function") {
            // get excludes
            let excludes = f.parameters[p_i]["exclude"];

            // roll function type by selecting random index
            let randomIndex = Math.floor(Math.random() * FUNCTIONS.length);

            // reroll function if same function is already used
            while (excludes.includes(FUNCTIONS[randomIndex]["name"])) {
                randomIndex = Math.floor(Math.random() * FUNCTIONS.length);
            }

            let i_func = selectFunction(randomIndex);
            
            // add parameter to parameterlist
            func.param.push({ "name": f.parameters[p_i]["name"], "type": "function", "value": i_func});
        }
        
    }

    return func;
}

function calculateCoefficients(funcs, nums) {
    let n = nums.length;
    
    // calculation step
    // Create the n by n matrix A by applying selected functions to user numbers
	let matrixA = [];
    for (let i = 1; i <= n; i++) {
        let row = [];
        funcs.forEach((func) => {
            row.push(func.func(i, func.param));
        });
        matrixA.push(row);
    }
    // Calculate the inverse of matrix A
    let matrixAInverse = math.inv(matrixA);
    // Create vector v from user numbers
    let vectorV = nums.slice();
    // Calculate the coefficients for selected functions
    return math.multiply(matrixAInverse, vectorV);
}

function handleSubmit(event) {
    // prevents default behavior
    if (event) {
        event.preventDefault();
    }

    // get numbers from input
    const inputNumbers = input_numbersInputTextfield.value.trim().split(' ').map(Number);

    // check if all entered numbers are valid
    if (inputNumbers.some(isNaN)) {
        div_resultContainer.textContent = "Please enter valid numbers separated by space.";
        return;
    }

    // check if at least numbers
    if (inputNumbers.length < 2) {
        div_resultContainer.textContent = "Please enter at least two numbers for prediction.";
        return;
    }

    // check if max numbers is surpassed
    if (inputNumbers.length > MAX_NUMBERS) {
        div_resultContainer.textContent = "Please enter no more than " + String(MAX_NUMBERS) + " numbers for prediction. ";
        return;
    } 

    // Select n random functions where n is the number of user numbers
    const n = inputNumbers.length;
    
    let selectedFunctions = [];
    let selectedIndices = [];
    for (let i = 0; i < n;) {
        // roll function type by selecting random index
        let randomIndex = Math.floor(Math.random() * FUNCTIONS.length);
        // reroll function if same function is already used
        let attempt = 0;
        while (selectedIndices.includes(randomIndex) && attempt < REROLL_ATTEMPTS) {
            randomIndex = Math.floor(Math.random() * FUNCTIONS.length);
        }
        
        let func = selectFunction(randomIndex);

        // push function and random index
        selectedFunctions.push(func);
        selectedIndices.push(randomIndex);
        i++;
    }
    delete selectedIndices;

    // calculation step
    const coefficients = calculateCoefficients(selectedFunctions, inputNumbers);

    // Generate the prediction function in LaTeX
    let desmosGraphFunction = "f(x) = ";
    selectedFunctions.forEach((func, index) => {
        desmosGraphFunction += `${coefficients[index]} \\cdot ${formatLatex(func)} + `;
    });
    desmosGraphFunction = desmosGraphFunction.slice(0, -3); // Remove the extra " + " at the end
    desmosGraphFunction = convertScientificToLatex(desmosGraphFunction);

    // displayed function
    let displayedFunction = buildDisplayedFunction(selectedFunctions, coefficients);

    // Calculate the next value using the predicted function
    let nextValue = calculate(selectedFunctions, coefficients, n + 1);

    // Display the prediction result
    div_resultContainer.innerHTML = '';

    var paragraph1 = document.createElement('p');
    paragraph1.innerHTML = "Predicted Function: <br><br>$" + displayedFunction + "$";
    div_resultContainer.appendChild(paragraph1);
    
    var paragraph2 = document.createElement('p');
    paragraph2.innerHTML = "Predicted next value: <br><br>$" + nextValue + "$";
    div_resultContainer.appendChild(paragraph2);

    // render the Latex
    MathJax.typesetPromise();

    // draw the graph
    var minVal = Math.min.apply(null, inputNumbers);
    minVal = Math.min(0, nextValue, minVal) - 3;
    var maxVal = Math.max.apply(null, inputNumbers);
    maxVal = Math.max(0, nextValue, maxVal) + 3;
    graphFunction(div_graphContainer, desmosGraphFunction, minVal, maxVal);
}

function formatLatex(func) {
    var latex_str = func.latex;
    func.param.forEach((p) => {
        if (p["type"] == "number") {
            latex_str = latex_str.replace("${" + p["name"] + "}", String(p["value"]));
        }
        else if (p["type"] == "function") {
            let p_latex_str = formatLatex(p["value"]);
            latex_str = latex_str.replace("${" + p["name"] + "}", p_latex_str);
        }
    });

    return latex_str;
}

function formatLatexShort(func) {
    var latex_str = func.latex;
    func.param.forEach((p) => {
        if (p["type"] == "number") {
            latex_str = latex_str.replace("${" + p["name"] + "}", String(p["value"].toFixed(2)));
        }
        else if (p["type"] == "function") {
            p_latex_str = formatLatexShort(p["value"]);
            
            latex_str = latex_str.replace("${" + p["name"] + "}", p_latex_str);
        }
    });

    return latex_str;
}

function buildDisplayedFunction(funcs, coeffs) {
    // displayed function
    let displayedFunction = "\\begin{align} f(x) &= ";
    
    const maxlength = Math.ceil(Math.floor(window.innerWidth / 250) / 1.5);
    let length = 1;
    console.log(window.innerWidth);
    console.log(maxlength);
    funcs.forEach((func, index) => {
        console.log(length);
        if (coeffs[index] == 0) { return; }
        if (length >= maxlength && index != 0) {
            displayedFunction += "\\\\ &";
            length = 0;
        }
        if (index != 0) {
            displayedFunction += (coeffs[index] >= 0) ? " + " : " - ";
        }
        let coeff = (Math.sign(coeffs[index]) * coeffs[index]).toFixed(2);
        displayedFunction += `${coeff} \\cdot ${formatLatexShort(func)}`;
        length++;
    });
    displayedFunction += "\\end{align}";
    return displayedFunction;
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

function graphFunction(destination, latex_str, minVal, maxVal, num_points=10) {
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





