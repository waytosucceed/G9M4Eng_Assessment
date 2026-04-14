var questions = []
var i = 0
var count = 0
var score = 0
var Ansgiven = [] // Store answers given by the user
var previousQuestionIndex = null // Track the previously displayed question
var topicName = '' // Variable to store the topic name
const submitSound = document.getElementById('submit-sound')

const uniqueKey = 'G9M4Eng_Assessment_MCQs'

// Helper function to save data in local storage under the unique key
function saveToLocalStorage (key, value) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {}
  storageData[key] = value
  localStorage.setItem(uniqueKey, JSON.stringify(storageData))
}

// Helper function to get data from local storage under the unique key
function getFromLocalStorage (key) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {}
  return storageData[key]
}

// Fetch the questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    // Get the selected topic from the URL
    const urlParams = new URLSearchParams(window.location.search)
    topicName = urlParams.get('topic') // Store topic name for later use

    // Find the questions for the selected topic
    const selectedTopic = data.topics.find(t => t.heading === topicName)

    if (selectedTopic) {
      questions = selectedTopic.questions // Access the questions array for the selected topic
      count = questions.length

      // Store total number of questions
      saveToLocalStorage(topicName + '_totalQuestions', count)

      // Load the heading from the selected topic
      const headingElement = document.getElementById('heading')
      if (headingElement) {
        headingElement.innerText = topicName || 'PS' // Set default heading if not provided
      }
      loadButtons()
      loadQuestion(i)

      // FIXED: Store ALL topics from the JSON file, not just the selected one
      saveToLocalStorage('topics', data.topics)
      
      // Also store the current topic data for reference
      saveToLocalStorage(topicName + '_topicData', selectedTopic)
    } else {
      const headingElement = document.getElementById('heading')
      const buttonContainer = document.getElementById('buttonContainer')
      if (headingElement) {
        headingElement.innerText = 'Topic not found'
      }
      if (buttonContainer) {
        buttonContainer.innerHTML = 'No questions available for this topic.'
      }
    }
  })

function loadButtons () {
  var buttonContainer = document.getElementById('buttonContainer')
  if (!buttonContainer) {
    console.error('buttonContainer element not found')
    return
  }
  
  buttonContainer.innerHTML = '' // Clear previous buttons
  for (var j = 0; j < questions.length; j++) {
    var btn = document.createElement('button')
    btn.className = 'btnButton btn smallbtn'
    btn.innerHTML = 'Q' + (j + 1)
    btn.setAttribute('onclick', 'abc(' + (j + 1) + ')')

    // Check if the topic has been completed and disable the button if necessary
    if (getFromLocalStorage(topicName + '_completed')) {
      btn.classList.add('disabled-btn')
      btn.disabled = true
    }

    buttonContainer.appendChild(btn)
  }
  // Update button styles based on answered questions
  updateButtonStyles()
}

//////////////for rendering fraction inputs//////////////////
function createDropdown(optionsArray) {
  const select = document.createElement('select');
  select.className = 'answer-input dropdown-input';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select';
  select.appendChild(defaultOption);

  optionsArray.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    handleInputAnswerChange();
  });

  return select;
}

function renderQuestionText (questionParts, questionElement) {
  if (!questionElement) {
    console.error('questionElement is null')
    return
  }
  
  questionElement.innerHTML = '' // Clear old content

  questionParts.forEach(part => {
    if (typeof part === 'string') {
      // Create a temporary div to parse HTML content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = part

      // If the string contains HTML tags, append as HTML
      if (part.includes('<') && part.includes('>')) {
        // Append all child nodes from the temporary div
        while (tempDiv.firstChild) {
          questionElement.appendChild(tempDiv.firstChild)
        }
      } else {
        // Plain text, append as text node
        questionElement.appendChild(document.createTextNode(part))
      }
    } else if (part.fraction) {
      const { whole, numerator, denominator } = part.fraction

      const span = document.createElement('span')
      span.className = 'mixed-fraction'

      if (whole !== undefined && whole !== '') {
        span.innerHTML = `
          <span class="whole">${whole}</span>
          <span class="fraction">
            <span class="numerator">${numerator}</span>
            <span class="denominator">${denominator}</span>
          </span>
        `
      } else {
        // Simple fraction only
        span.innerHTML = `
            <span class="whole">&nbsp;</span>

          <span class="fraction">
            <span class="numerator">${numerator}</span>
            <span class="denominator">${denominator}</span>
          </span>
        `
      }
      questionElement.appendChild(span)
    }
  })
}

function loadTableQuestion(randomQuestion, optionsElement, index) {
  // Clear and set up the options element for table display
  optionsElement.innerHTML = '';
  optionsElement.style.display = 'flex';
  optionsElement.style.flexDirection = 'row';
  optionsElement.style.alignItems = 'flex-start';
  optionsElement.style.gap = '2%';
  optionsElement.classList.add('table-question');

  // Create main container for side-by-side layout
  var mainContainer = document.createElement('div');
  mainContainer.style.display = 'flex';
  mainContainer.style.width = '100%';
  mainContainer.style.gap = '2%';
  mainContainer.style.alignItems = 'flex-start';

  // Create question container (left side - 55%)
  var questionContainer = document.createElement('div');
  questionContainer.className = 'question-container';
  questionContainer.style.width = '55%';
  questionContainer.style.display = 'flex';
  questionContainer.style.flexWrap = 'wrap';
  questionContainer.style.justifyContent = 'flex-start';
  questionContainer.style.alignItems = 'center';
  questionContainer.style.gap = '5px';
  questionContainer.style.fontSize = '1.5em';
  questionContainer.style.textAlign = 'left';
  questionContainer.style.padding = '0% 2%';

  // Display the question text
  if (randomQuestion.question) {
    // Handle question text formatting (for fractions and regular text)
    if (Array.isArray(randomQuestion.question)) {
      renderQuestionText(randomQuestion.question, questionContainer);
    } else {
      questionContainer.innerHTML = randomQuestion.question;
    }
  }

  // Create table container (right side - 45%)
  var tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  tableContainer.style.width = '45%';
  tableContainer.style.display = 'flex';
  tableContainer.style.justifyContent = 'center';
  tableContainer.style.alignItems = 'flex-start';

  // Create the table element
  var table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.border = '2px solid black';
  table.style.fontSize = '1.1em';
  table.style.width = '100%';
  table.style.maxWidth = '90%';

  let inputIndex = 0;

  // Process each row in the table structure
  randomQuestion.tableStructure.forEach((row, rowIndex) => {
    var tr = document.createElement('tr');
    
    row.forEach((cell, cellIndex) => {
      var td = document.createElement('td');
      td.style.border = '2px solid black';
      td.style.padding = '2%';
      td.style.textAlign = 'center';
      td.style.minWidth = '60px';
      td.style.minHeight = '45px';
      
      // Style header row and column differently
      if (rowIndex === 0 || cellIndex === 0) {
        td.style.backgroundColor = '#f0f0f0';
        td.style.fontWeight = 'bold';
      }

      if (cell === 'INPUT') {
        // Create input field for table cell
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'answer-input table-input';
        input.style.width = '55px';
        input.style.height = '35px';
        input.style.textAlign = 'center';
        input.style.border = 'none';
        // input.style.border = '1px solid #007bff';
        // input.style.borderRadius = '4px';
        input.style.fontSize = '1.1em';
        input.style.backgroundColor = 'white';
        
        // Add event listener for input changes
        input.addEventListener('input', function() {
          handleInputAnswerChange();
        });

        td.appendChild(input);
        inputIndex++;
      } else if (cell === '' && rowIndex > 0 && cellIndex > 0) {
        // Empty cells that are not headers - style them as gray/disabled
        td.style.backgroundColor = '#81D486';
        td.style.color = '';
        td.innerHTML = '&nbsp;'; // Non-breaking space to maintain cell structure
      } else {
        // Regular text cell (headers or filled cells)
        td.innerHTML = cell;
      }
      
      tr.appendChild(td);
    });
    
    table.appendChild(tr);
  });

  tableContainer.appendChild(table);

  // Add both containers to main container
  mainContainer.appendChild(questionContainer);
  mainContainer.appendChild(tableContainer);

  // Add main container to options element
  optionsElement.appendChild(mainContainer);

  // Restore previous answers for table inputs
  var previouslyEntered = Ansgiven[index];
  if (previouslyEntered && Array.isArray(previouslyEntered)) {
    let inputs = tableContainer.querySelectorAll('.table-input');
    inputs.forEach((input, idx) => {
      if (previouslyEntered[idx] !== undefined && previouslyEntered[idx] !== '') {
        input.value = previouslyEntered[idx];
      }
    });
  }
}

function loadQuestion(index) {
  var randomQuestion = questions[index];
  if (!randomQuestion) {
    console.error('No question found at index:', index);
    return;
  }

  /* =======================
     BASIC ELEMENTS
  ======================= */
  var questionElement = document.getElementById('question');
  var optionsElement = document.getElementById('options');
  var picDiv = document.getElementById('picdiv');

  var content = document.querySelector('.question-content');
  var imageArea = document.querySelector('.question-image-area');
  var optionsArea = document.querySelector('.question-options-area');

  if (!questionElement || !optionsElement || !picDiv) {
    console.error('Required DOM elements missing');
    return;
  }

  // Reset
  questionElement.innerHTML = '';
  optionsElement.innerHTML = '';
  picDiv.innerHTML = '';

  /* =======================
     QUESTION TEXT
  ======================= */
  if (
    (randomQuestion.input && Array.isArray(randomQuestion.input)) ||
    randomQuestion.displayType === 'table'
  ) {
    // Input / table questions show question inside options
    questionElement.innerHTML = '';
  } else {
    if (Array.isArray(randomQuestion.question)) {
      renderQuestionText(randomQuestion.question, questionElement);
    } else {
      questionElement.innerHTML = randomQuestion.question;
    }
  }

  /* =======================
     STORY / IMAGE / NONE
  ======================= */
  // Default reset
  if (content) content.style.display = 'flex';

  if (randomQuestion.story) {
    // STORY ON LEFT
    picDiv.innerHTML = `<div class="story-text">${randomQuestion.story}</div>`;
    picDiv.style.display = 'block';

    if (imageArea) imageArea.style.display = 'block';
    if (optionsArea) optionsArea.style.display = 'block';

  } else if (randomQuestion.image) {
    // IMAGE ON LEFT
    var img = document.createElement('img');
    img.src = randomQuestion.image;
    img.alt = 'Question Image';
    img.style.maxWidth = '90%';
    img.style.maxHeight = '250px';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '8px';

    picDiv.appendChild(img);
    picDiv.style.display = 'block';

    if (imageArea) imageArea.style.display = 'block';
    if (optionsArea) optionsArea.style.display = 'block';

  } else {
    // NO STORY, NO IMAGE → FULL WIDTH RIGHT
    picDiv.style.display = 'none';

    if (imageArea) imageArea.style.display = 'none';
    if (optionsArea) {
      optionsArea.style.flex = '1';
      optionsArea.style.maxWidth = '';
      optionsArea.style.margin = '0 auto';
    }
  }

  /* =======================
     QUESTION SOUND
  ======================= */
  if (randomQuestion.questionSound) {
    var soundButton = document.createElement('button');
    soundButton.className = 'btn btn-sound';
    soundButton.innerText = '🔊 Play Sound';
    soundButton.onclick = function () {
      new Audio(randomQuestion.questionSound).play();
    };

    if (
      !(
        (randomQuestion.input && Array.isArray(randomQuestion.input)) ||
        randomQuestion.displayType === 'table'
      )
    ) {
      questionElement.appendChild(soundButton);
    }
  }

  /* =======================
     OPTIONS / INPUT / TABLE
  ======================= */
  if (randomQuestion.input && Array.isArray(randomQuestion.input)) {
    loadInputQuestion(randomQuestion, optionsElement, index);
  } else if (randomQuestion.options) {
    loadOptionQuestion(randomQuestion, optionsElement, index);
  }

  /* =======================
     UI UPDATES
  ======================= */
  updateButtonVisibility();
  updateButtonStyles();
  updateButtonText();
}


function loadInputQuestion(randomQuestion, optionsElement, index) {

  /* ---------- TABLE QUESTIONS ---------- */
  if (randomQuestion.displayType === 'table' && randomQuestion.tableStructure) {
    loadTableQuestion(randomQuestion, optionsElement, index);
    return;
  }

  optionsElement.innerHTML = '';
  optionsElement.style.display = 'flex';
  optionsElement.style.flexDirection = 'column';
  optionsElement.style.alignItems = 'center';
  optionsElement.classList.add('input-question');

  const questionContainer = document.createElement('div');
  questionContainer.className = 'question-container';
  questionContainer.style.display = 'flex';
  questionContainer.style.flexWrap = 'wrap';
  questionContainer.style.justifyContent = 'center';
  questionContainer.style.alignItems = 'center';
  questionContainer.style.gap = '6px';
  questionContainer.style.fontSize = '1.4em';
  questionContainer.style.fontWeight = 'bold';
  questionContainer.style.marginBottom = '20px';

  let inputIndex = 0;

  /* =========================================================
     STRING QUESTION (simple inputs + dropdowns)
  ========================================================= */
  if (typeof randomQuestion.question === 'string') {

    const brParts = randomQuestion.question.split('<br>');

    brParts.forEach((line, lineIdx) => {

      // Split by BOTH dropdown and input placeholders
      const tokenRegex = /(<drop>______<\/drop>|______)/g;
      const parts = line.split(tokenRegex);

      parts.forEach(part => {

        // ---------- DROPDOWN ----------
        if (
          part === '<drop>______</drop>' &&
          randomQuestion.type === 'drop-down' &&
          Array.isArray(randomQuestion.operators)
        ) {
          const select = document.createElement('select');
          select.className = 'answer-input dropdown-input';

          const def = document.createElement('option');
          def.value = '';
          def.textContent = 'Select';
          select.appendChild(def);

          randomQuestion.operators.forEach(op => {
            const opt = document.createElement('option');
            opt.value = op;
            opt.textContent = op;
            select.appendChild(opt);
          });

          select.addEventListener('change', handleInputAnswerChange);
          questionContainer.appendChild(select);
          inputIndex++;
        }

        // ---------- NORMAL INPUT ----------
        else if (part === '______') {
          if (inputIndex < randomQuestion.input.length) {
            addInputField(questionContainer, randomQuestion.input[inputIndex]);
            inputIndex++;
          }
        }

        // ---------- TEXT ----------
        else if (part.trim()) {
          const span = document.createElement('span');
          span.innerHTML = part;
          questionContainer.appendChild(span);
        }
      });

      // Line break
      if (lineIdx < brParts.length - 1) {
        questionContainer.appendChild(document.createElement('br'));
        const lb = document.createElement('div');
        lb.style.flexBasis = '100%';
        questionContainer.appendChild(lb);
      }
    });
  }

  /* =========================================================
     ARRAY QUESTION (fractions etc.)
  ========================================================= */
  else if (Array.isArray(randomQuestion.question)) {

    randomQuestion.question.forEach(part => {

      if (typeof part === 'string') {
        const pieces = part.split('______');

        pieces.forEach((txt, idx) => {
          if (txt) {
            const span = document.createElement('span');
            span.innerHTML = txt;
            questionContainer.appendChild(span);
          }

          if (idx < pieces.length - 1 && inputIndex < randomQuestion.input.length) {
            addInputField(questionContainer, randomQuestion.input[inputIndex]);
            inputIndex++;
          }
        });
      }

      else if (part.fraction) {
        const { whole, numerator, denominator } = part.fraction;
        const span = document.createElement('span');
        span.className = 'mixed-fraction';
        span.innerHTML = `
          <span class="whole">${whole || '&nbsp;'}</span>
          <span class="fraction">
            <span class="numerator">${numerator}</span>
            <span class="denominator">${denominator}</span>
          </span>
        `;
        questionContainer.appendChild(span);
      }
    });
  }

  optionsElement.appendChild(questionContainer);

  /* =========================================================
     RESTORE PREVIOUS ANSWERS
  ========================================================= */
  const previous = Ansgiven[index];
  if (Array.isArray(previous)) {
    const inputs = questionContainer.querySelectorAll('.answer-input');
    inputs.forEach((el, i) => {
      if (previous[i] !== undefined) {
        el.value = previous[i];
      }
    });
  }
}




function addInputField(container, inputField) {
  let inputElement = createInputElement(inputField);
  container.appendChild(inputElement);
}

// Helper function to create input element
function createInputElement(inputField) {
  let inputElement = document.createElement('input');
  inputElement.type = 'text';
  inputElement.className = 'answer-input';
  // inputElement.placeholder = inputField.operand; 
  inputElement.style.padding = '8px';
  inputElement.style.fontSize = '1em';
  inputElement.style.border = '2px solid #ccc';
  inputElement.style.borderRadius = '6px';
  inputElement.style.textAlign = 'center';
  inputElement.style.width = '200px';
  inputElement.style.maxWidth = '100px';

  // Event listener to capture changes
  inputElement.addEventListener('input', function() {
    handleInputAnswerChange();
  });

  return inputElement;
}

function loadOptionQuestion (randomQuestion, optionsElement, index) {
  // Check if any option has an image
  var hasImageOptions = randomQuestion.options.some(option => option.image)
  var hasTextOnlyOptions = randomQuestion.options.every(option => !option.image)

  // Apply layout based on content
  if (hasImageOptions) {
    optionsElement.style.display = 'grid'
    optionsElement.style.gridTemplateColumns = 'repeat(2, 1fr)' // Two columns per row
    optionsElement.style.gap = '1rem' // Space between grid items
    optionsElement.style.justifyContent = 'center'
    optionsElement.classList.remove('text-only')
  } else if (hasTextOnlyOptions) {
    optionsElement.classList.add('text-only')
    optionsElement.classList.remove('input-question')
  }

  var selectedLi = null
  var defaultBackgroundColor = '#699e19'

  // Iterate through the options and display them
  randomQuestion.options.forEach(function (option, idx) {
    var li = document.createElement('li')
    li.classList.add('option-container')
    li.setAttribute('onclick', 'optionContainer()')
    li.onclick = function () {
      // If there is already a selected li, remove its style
      if (selectedLi) {
        selectedLi.style.border = ''
      }

      // Add the border to the clicked li
      // li.style.border = "3px solid #007bff";
      // li.style.borderRadius = "8px";

      // Update the selectedLi variable to the currently clicked li
      selectedLi = li
    }

    // Create the radio button for the option
    var radioButton = document.createElement('input')
    radioButton.type = 'radio'
    radioButton.name = 'answer'
    radioButton.value = idx
    radioButton.style.display = 'none' // Hide the radio button

    if (option.image) {
      // Create the image element for the option
      var optionWithImage = document.getElementById('options')
      if (optionWithImage) {
        optionWithImage.style.gap = '1rem'
      }
      var optionImage = document.createElement('img')
      optionImage.src = option.image
      optionImage.alt = 'Option Image'
      optionImage.style.width = '100%'
      // optionImage.style.maxWidth = '250px'
      optionImage.style.maxHeight = '100px'
      // optionImage.style.borderRadius = "12px";
      optionImage.style.cursor = 'pointer'

      optionImage.onclick = function () {
        radioButton.checked = true
        optionImage.style.border = '3px solid #007bff'
        handleAnswerChange() // Call the answer change handler
      }

      optionImage.onmouseover = function () {
        if (option.sound) {
          playOptionSound(option.sound)
        }
      }

      optionImage.onmouseout = function () {
        if (!radioButton.checked) {
          optionImage.style.border = 'none'
        }
      }

      // Append the image to the list item
      li.appendChild(optionImage)
    } else {
      var selectedButton = null
      var defaultBackgroundColor = '#699e19'

      var optionWithText = document.getElementById('options')
      if (optionWithText) {
        optionWithText.style.display = 'grid'
        // optionWithText.style.flexDirection = "column";
      }

      var optionTextButton = document.createElement('button')

      optionTextButton.className = 'btnOption'
      // optionTextButton.innerHTML = option.text

      //////////////// for Inserting fraction in options ///////////////
      if (option.fraction) {
        const { whole, numerator, denominator } = option.fraction
        optionTextButton.innerHTML = `
    <span class="mixed-fraction">
      <span class="whole">${whole}</span>
      <span class="fraction">
        <span class="numerator">${numerator}</span>
        <span class="denominator">${denominator}</span>
      </span>
    </span>
  `
      } else {
        optionTextButton.innerHTML = option.text
      }
      // optionTextButton.style.marginBottom = "20px";
      optionTextButton.onclick = function () {
        radioButton.checked = true // Select the corresponding radio button

        // Reset all option buttons
        var allOptionButtons = document.querySelectorAll('.btnOption')
        allOptionButtons.forEach(btn => {
          btn.style.backgroundColor = ''
          btn.style.border = ''
        })

        // Highlight selected button
        optionTextButton.style.backgroundColor = '#e3f2fd'
        optionTextButton.style.border = '2px solid #007bff'
        optionTextButton.style.color = 'black'

        selectedButton = optionTextButton
        handleAnswerChange() // Call the answer change handler
      }

      // Append the text button to the list item
      li.appendChild(optionTextButton)
    }

    // Append the radio button to the list item
    li.appendChild(radioButton)

    // Append the list item to the options container
    optionsElement.appendChild(li)
  })

  // Restore previously selected answer if exists
  var previouslySelected = Ansgiven[index]
  if (previouslySelected !== null && previouslySelected !== undefined) {
    var previouslySelectedElement = optionsElement.querySelector(
      'input[name="answer"][value="' + previouslySelected + '"]'
    )
    if (previouslySelectedElement) {
      previouslySelectedElement.checked = true

      // Find the corresponding button or image based on the index
      var previouslySelectedLi = previouslySelectedElement.closest('li')

      // Apply styling to the previously selected option
      if (previouslySelectedLi) {
        previouslySelectedLi.style.border = '3px solid #007bff'
        previouslySelectedLi.style.borderRadius = '8px'
        selectedLi = previouslySelectedLi // Update selectedLi with the previously selected element

        // If it's a text option, highlight the button
        var textButton = previouslySelectedLi.querySelector('.btnOption')
        if (textButton) {
          textButton.style.backgroundColor = '#e3f2fd'
          textButton.style.border = '2px solid #007bff'
          textButton.style.color = 'black'
        }
      }
    }
  }
}

function handleInputAnswerChange () {
  // Show the Submit Answer button and hide the Next button when input is entered
  const subbtn = document.getElementById('subbtn')
  const nextbtn = document.getElementById('nextbtn')
  if (subbtn) subbtn.style.display = 'inline-block'
  if (nextbtn) nextbtn.style.display = 'none'
}

function playOptionSound (option) {
  var sound = new Audio(option)
  sound.play()
}

function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function getOptionLabel (option) {
  if (option.endsWith && option.endsWith('.mp3')) {
    var label = option.split('/').pop().replace('.mp3', '')
    return capitalizeFirstLetter(label)
  }
  return option.text || option
}

function handleAnswerChange () {
  // Show the Submit Answer button and hide the Next button when an answer is selected
  const subbtn = document.getElementById('subbtn')
  const nextbtn = document.getElementById('nextbtn')
  if (subbtn) subbtn.style.display = 'inline-block'
  if (nextbtn) nextbtn.style.display = 'none'
}

function newques () {
  // Save the answer for the current question
  saveCurrentAnswer()

  if (i === count - 1) {
    const questiondiv = document.getElementById('questiondiv')
    if (questiondiv) {
      questiondiv.style.textAlign = 'center'
    }

    // Display results
    displayResults()

    // Hide buttonContainer
    const buttonContainer = document.getElementById('buttonContainer')
    if (buttonContainer) {
      buttonContainer.style.display = 'none'
    }
  } else {
    // Move to the next question
    i++
    loadQuestion(i)
    const result = document.getElementById('result')
    const subbtn = document.getElementById('subbtn')
    const nextbtn = document.getElementById('nextbtn')
    
    if (result) result.innerHTML = ''
    if (subbtn) subbtn.style.display = 'inline-block'
    if (nextbtn) nextbtn.style.display = 'none'

    // Update button visibility and styles
    updateButtonVisibility()
    updateButtonStyles()
  }
}

// Save the answer for the current question
function saveCurrentAnswer() {
  var currentQuestion = questions[i];

  if (currentQuestion.input && Array.isArray(currentQuestion.input)) {
    // Handle input type questions
    var inputs = document.querySelectorAll('.answer-input, .dropdown-input');
    var inputAnswers = [];
    var hasAnswer = false;

    inputs.forEach(function(input) {
      var value = input.value.trim().toLowerCase(); // Convert to lowercase here
      inputAnswers.push(value);
      if (value !== '') {
        hasAnswer = true;
      }
    });

    Ansgiven[i] = hasAnswer ? inputAnswers : null;
  } else {
    // Handle regular option-based questions
    var selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (selectedAnswer) {
      Ansgiven[i] = parseInt(selectedAnswer.value); // Store answer as an index
    } else {
      Ansgiven[i] = null; // Mark as not answered
    }
  }

  console.log('score', score);
  saveToLocalStorage('Ansgiven', Ansgiven); // Save the updated answers array to local storage
}

// Add this helper function at the top of your file, after the existing helper functions
// Replace the existing formatFractionForDisplay function with this updated version
function formatFractionForDisplay(option) {
  if (option && option.fraction) {
    const { whole, numerator, denominator } = option.fraction;
    
    // Create HTML structure for visual fraction display
    let fractionHTML = '<span class="display-fraction">';
    
    if (whole !== undefined && whole !== '' && whole !== null) {
      // Mixed fraction: whole number + fraction
      fractionHTML += `
        <span class="whole-part">${whole}</span>
        <span class="fraction-part">
          <span class="numerator">${numerator}</span>
         
          <span class="denominator">${denominator}</span>
        </span>
      `;
    } else {
      // Simple fraction only
      fractionHTML += `
        <span class="fraction-part">
          <span class="numerator">${numerator}</span>

          <span class="denominator">${denominator}</span>
        </span>
      `;
    }
    
    fractionHTML += '</span>';
    return fractionHTML;
  }
  return option.text || option;
}

// Also update the displayResults function to properly handle HTML content
// Replace the section where you build the pageDiv content with this:

function displayResults() {
  // Calculate the score based on saved answers
  score = Ansgiven.reduce((total, answer, index) => {
    if (questions[index].options) {
      // Multiple-choice question
      return answer === questions[index].answer ? total + 1 : total;
    } else {
      // Open-ended question with input boxes
      return (JSON.stringify(answer) === JSON.stringify(questions[index].answer)) ? total + 1 : total;
    }
  }, 0);

  console.log("score", score);

  // Save score and completion status to local storage
  saveToLocalStorage(topicName + '_score', score);
  saveToLocalStorage(topicName + '_completed', true); // boolean ✅

  // Hide certain elements with null checks
  const questionBackground = document.getElementById("question_background");
  const question = document.getElementById("question");
  const nextbtn = document.getElementById("nextbtn");
  const result = document.getElementById("result");
  const options = document.getElementById("options");
  const head = document.getElementById("head");
  
  if (questionBackground) questionBackground.style.display = "none";
  if (question) question.style.display = "none";
  if (nextbtn) nextbtn.style.display = "none";
  if (result) result.style.display = "none";
  if (options) options.style.display = "none";
  if (head) head.innerHTML = "Check Your Answers";
  const element = document.querySelector('.question-content');
  element.style.display= 'flex';
  const element1 = document.querySelector('.question-image-area');
  element1.style.display= 'block';


  // Calculate percentage and feedback message
  var percentage = Math.round((score / questions.length) * 100); // Round percentage for cleaner display
  var progressBarColor = "";
  var feedbackMessage = "";
  
  if (percentage <= 40) {
    progressBarColor = "#F28D8D"; /* Dark Pastel Red */
    feedbackMessage = "You may need more practice.";
  } else if (percentage > 40 && percentage <= 70) {
    progressBarColor = "#6C8EBF"; /* Dark Pastel Blue */
    feedbackMessage = "Well done!";
  } else if (percentage > 70) {
    progressBarColor = "#B5E7A0"; /* Dark Pastel Green */
    feedbackMessage = "Excellent job!";
  }

  // Set up feedback section
  var mainDiv = document.getElementsByClassName("maindiv")[0];

  if (mainDiv) {
    mainDiv.style.display = 'flex';
  } else {
    console.error('No element with class "maindiv" found');
  }

  const picdiv = document.getElementById("picdiv");
  if (picdiv) {
    picdiv.classList.remove("col-md-12");
    picdiv.classList.remove("col-lg-12");
    picdiv.classList.remove("col-sm-12");
    picdiv.classList.remove("col-xs-12");
    picdiv.classList.add("col-md-7");
    picdiv.classList.add("col-lg-7");
    picdiv.classList.add("col-sm-7");
    picdiv.classList.add("col-xs-7");
    picdiv.style.backgroundColor = "#B7A0D0"; /* Dark Pastel Lavender */
    picdiv.style.fontSize = "1.8rem"; /* Larger font size for feedback */
    picdiv.style.textAlign = "center";
    picdiv.style.color = "#333"; /* Darker color for text */
    picdiv.style.display = "block";
  }

  var Dis = "<br><br><br><br><br>Thank you for participating.<br><br>Score: " + score + "/" + questions.length + "<br><br>";
  
  // Updated home link to redirect to index.html instead of just showing "Next"
  var home = "<a href='index.html'><b class='btn btn-success next-btn-progress'>Next</b></a><br>";
  
  // FIXED: Properly structured progress bar HTML with correct Bootstrap classes
  var progressBarHTML = `
    <div class="progress" style="margin: 20px 0; height: 30px; background-color: #e9ecef; border-radius: 15px; overflow: hidden;">
      <div class="progress-bar" 
           role="progressbar" 
           aria-valuenow="${percentage}" 
           aria-valuemin="0" 
           aria-valuemax="100" 
           style="width: ${percentage}%; 
                  background-color: ${progressBarColor}; 
                  height: 100%; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  color: white; 
                  font-weight: bold; 
                  font-size: 16px;
                  transition: width 0.6s ease;">
        ${percentage}%
      </div>
    </div>
  `;
  
  // var content = Dis + feedbackMessage + "<br>" + progressBarHTML + home;
   var content = Dis + feedbackMessage + "<br><div class='progress'> <div class='progress-bar' role='progressbar' aria-valuenow='" + percentage + "' aria-valuemin='0' aria-valuemax='100' style='width:" + percentage + "%;background-color:" + progressBarColor + ";'> </div></div>" + home;

  // Store the results content in local storage with a unique key
  saveToLocalStorage(topicName + '_results_content', content);

  // Display the feedback content in picdiv
  if (picdiv) {
    picdiv.innerHTML = content;
  }

  // Prepare question and answer details for review
  var questionContent = "";
  const questiondiv = document.getElementById("questiondiv");
  if (questiondiv) {
    questiondiv.classList.remove("input");
    questiondiv.style.textAlign = "left";
    questiondiv.style.color = "black";
    questiondiv.style.fontSize = "18px";
    questiondiv.innerHTML = ""; // Clear previous content
  }

  // Build detailed question review
  for (var j = 0; j < questions.length; j++) {
    var ques = questions[j].question;
    var questionText = "";
    
    // Handle question text formatting (for fractions and regular text)
    if (Array.isArray(ques)) {
      questionText = ques.map(part => {
        if (typeof part === 'string') {
          return part;
        } else if (part.fraction) {
          return formatFractionForDisplay(part);
        }
        return '';
      }).join('');
    } else {
      questionText = ques;
    }

    // Determine correct answer
    var correctAnswer = "";
    if (questions[j].options) {
      // Multiple choice question
      var correctOption = questions[j].options[questions[j].answer];
      if (correctOption) {
        if (correctOption.image) {
          // Handle image option
          correctAnswer = `<img src="${correctOption.image}" alt="Correct Answer" style="max-width: 150px; max-height: 100px; border-radius: 5px; border: 2px solid #28a745;">`;
        } else if (correctOption.fraction) {
          // Handle fraction option
          correctAnswer = formatFractionForDisplay(correctOption);
        } else {
          // Handle text option
          correctAnswer = correctOption.text || correctOption;
        }
      }
    } else {
      // Input question
      correctAnswer = Array.isArray(questions[j].answer) ? 
        questions[j].answer.join(', ') : 
        questions[j].answer;
    }

    // Determine user's answer
    var userAnswer = "";
    var isCorrect = false;
    
    if (Ansgiven[j] !== null && Ansgiven[j] !== undefined) {
      if (questions[j].options) {
        // Multiple choice
        var selectedOption = questions[j].options[Ansgiven[j]];
        if (selectedOption) {
          if (selectedOption.image) {
            // Handle image option
            var borderColor = (Ansgiven[j] === questions[j].answer) ? "#28a745" : "#dc3545";
            userAnswer = `<img src="${selectedOption.image}" alt="Your Answer" style="max-width: 150px; max-height: 100px; border-radius: 5px; border: 2px solid ${borderColor};">`;
          } else if (selectedOption.fraction) {
            // Handle fraction option
            userAnswer = formatFractionForDisplay(selectedOption);
          } else {
            // Handle text option
            userAnswer = selectedOption.text || selectedOption;
          }
        }
        isCorrect = Ansgiven[j] === questions[j].answer;
      } else {
        // Input question
        userAnswer = Array.isArray(Ansgiven[j]) ? 
          Ansgiven[j].join(', ') : 
          Ansgiven[j];
        isCorrect = JSON.stringify(Ansgiven[j]) === JSON.stringify(questions[j].answer);
      }
    } else {
      userAnswer = "Not answered";
    }

    // Color coding for correct/incorrect answers (only for text answers)
    var answerColor = isCorrect ? "#28a745" : "#dc3545"; // Green for correct, red for incorrect
   
    // Build the question review HTML
    questionContent += `
      <div class="question-review" style="padding: 15px; margin-bottom: 15px;">
        <div style="font-weight: bold; margin-bottom: 10px;">
          Question ${j + 1}: ${questionText}
        </div>
        
        ${questions[j].image ? `<div style="margin: 10px 0;"><img src="${questions[j].image}" alt="Question Image" style="max-width: 300px; max-height: 200px; border-radius: 5px;"></div>` : ''}
        
        <div style="margin: 8px 0;">
          <strong>Your Answer:</strong> 
          ${userAnswer.includes('<img') ? userAnswer : `<span style="color: ${answerColor};">${userAnswer}</span>`}
        </div>
        
        <div style="margin: 8px 0;">
          <strong>Correct Answer:</strong> 
          ${correctAnswer.includes('<img') ? correctAnswer : `<span style="color: #28a745;">${correctAnswer}</span>`}
        </div>
        
        ${questions[j].explanation ? `<div style="margin: 8px 0; font-style: italic; color: #666;"><strong>Explanation:</strong> ${questions[j].explanation}</div>` : ''}
      </div>
    `;
  }

  saveToLocalStorage(topicName + '_question_content', questionContent);

  // Display the question review
  if (questiondiv) {
    picdiv.innerHTML = content;
    questiondiv.innerHTML = questionContent + home;
  }

  // Update button styles to show completion
  updateButtonStyles();
  
  // Disable all question navigation buttons
  var buttons = document.querySelectorAll('.btnButton');
  buttons.forEach(button => {
    button.classList.add('disabled-btn');
    button.disabled = true;
  });
}

function checkAnswer() {
  submitSound.play();

  // Save the answer for the current question
  saveCurrentAnswer();
  
  // Hide submit button and show next button
  document.getElementById("subbtn").style.display = "none";
  document.getElementById("nextbtn").style.display = "inline-block";

  // Update the button styles to mark this question as answered
  updateButtonStyles();
}


function abc(x) {
  // Save the current answer before changing questions
  saveCurrentAnswer();
  i = x - 1;
  loadQuestion(i);
  document.getElementById("result").innerHTML = "";
  document.getElementById("subbtn").style.display = "inline-block";
  document.getElementById("nextbtn").style.display = "none";

  // Update button styles and visibility
  highlightButton(i);
  updateButtonStyles();
}
var isSubmitted = false; 

function updateButtonVisibility() {
  var selectedAnswer = document.querySelector('input[name="answer"]:checked');
  var textAreaAnswer = document.getElementById("answerTextArea");
  var submitButton = document.getElementById("subbtn");
  var nextButton = document.getElementById("nextbtn");

  if (!isSubmitted) {
    // Show Submit button when question loads
    submitButton.style.display = "inline-block";
    nextButton.style.display = "none";
  } else {
    // After submission, hide Submit and show Next button
    submitButton.style.display = "none";
    nextButton.style.display = "inline-block";
  }
}

function submitAnswer() {
  isSubmitted = true; // Mark as submitted
  updateButtonVisibility(); // Update buttons
}

function highlightButton(index) {
  var buttonContainer = document.getElementById("buttonContainer");
  var buttons = buttonContainer.getElementsByTagName("button");

  // Remove highlight from all buttons
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].classList.remove("highlighted-btn");
  }

  // Add highlight to the current button
  if (index >= 0 && index < buttons.length) {
    buttons[index].classList.add("highlighted-btn");
  }
}

function updateButtonStyles() {
  var buttonContainer = document.getElementById("buttonContainer");
  var buttons = buttonContainer.getElementsByTagName("button");

  // Remove "answered-btn" class from all buttons
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].classList.remove("answered-btn");
  }

  // Add "answered-btn" class only after the submit button is clicked
 // Add "answered-btn" class only after the submit button is clicked and input is not empty
 Ansgiven.forEach((answer, index) => {
  console.log("answer", answer)
  if (answer !== null && answer[0] !== null) {  // Ensure the answer is not null or empty
    console.log("not ")
    if (index >= 0 && index < buttons.length) {
      buttons[index].classList.add("answered-btn");
      console.log("added")
    }
  }
});
}


function updateButtonText() {
  var nextButton = document.getElementById("nextbtn");
  if (i === count - 1) {
    nextButton.innerHTML = "FINISH TEST";
    nextButton.onclick = function() {
      newques(); // Calls newques which will hide buttonContainer
    };
  } else {
    nextButton.innerHTML = "Next";
   
  }
}


