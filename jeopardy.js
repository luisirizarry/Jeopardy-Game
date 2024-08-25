// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const categories = [];

const NUM_CATEGORIES = 6;

const NUM_QUESTIONS_PER_CAT = 5;

const randomCategories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

function getCategoryIds() {
    const categoryIds = [];
    const indexChosen = [];

    while (indexChosen.length < NUM_CATEGORIES) {
        // Get a random index in the range of available categories
        let randomIndex = Math.floor(Math.random() * categories.length);

        // Check if the index has already been used
        if (!indexChosen.includes(randomIndex)) {
            // Store the current index
            indexChosen.push(randomIndex); 
            // Store the category ID so we dont use it again
            categoryIds.push(categories[randomIndex].clueId); 
        }
    }
    // Return the ids
    return categoryIds;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

function getCategory(catId) {
    // Iterate through categories
    for (let category of categories) {
        // See if the clueId matches to Id we're looking for
        if (category.clueId === catId) {
            return {
                // Return the category data we want 
                title: category.title,
                clueId: category.clueId,
                clues: category.clues.map(clue => ({
                    question: clue.question,
                    answer: clue.answer,
                    showing: clue.showing,
                    id: clue.id
                }))
            };
        }
    }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    // Create a thead and tbody
    const $thead = $('<thead>');
    const $tbody = $('<tbody>');

    // Create the header row
    const $headerRow = $('<tr>');
    randomCategories.forEach(category => {
        // Insert title to each row
        $headerRow.append(`<th>${(category.title).toUpperCase()}</th>`); 
    });
    // Appen row to thead
    $thead.append($headerRow);

    // Create the rows for the questions
    for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
        const $row = $('<tr>');

        // Create a td for each clue, and include the specific id each clue has in the data attribute
        randomCategories.forEach((category) => {
            const clue = category.clues[i];
            $row.append(`<td data-clue-id="${clue.id}">?</td>`);
        });

        // add the row to the tbody
        $tbody.append($row);
    }

    // Clear old table and add the thead and tbody for the new table
    $("#jeopardy").empty().append($thead).append($tbody);
}



/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    // Get the clicked td
    const td = $(evt.target);
    
    // Get the data-clue-id
    const clueId = td.attr('data-clue-id');

    // Find the clue with the same id
    for (let category of randomCategories) {
        for (let clue of category.clues) {
            // When the clue if found, either show the question, or the answer
            if (clue.id == clueId) {
                if (clue.showing === null) {
                    clue.showing = "question";
                    td.html(clue.question);
                } else if (clue.showing === "question") {
                    clue.showing = "answer";
                    td.html(clue.answer);
                    // Make the background green
                    td.css('background-color', 'green');
                    // Will add the special cursor used in example
                    td.attr("id", "answer")
                }
                return;
            }
        }
    }
}


/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    // Show the spinner
    $("#loading-spinner").css("display", "block");
    // Hide the table
    $("table#jeopardy").css("display", "none");
    // Change button text 
    $("button").text("Loading..."); 
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    // Hide the spinner
    $("#loading-spinner").css("display", "none"); 
    // Show the table
    $("table#jeopardy").css("display", "table"); 
    // Change button text
    $("button").text("Restart!"); 
}

/** Start game:
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    // Reset both category arrays
    categories.length = 0;
    randomCategories.length = 0;

    // Start showing spinner
    showLoadingView();

    // Get categories from the API and push them to the categories array
    for (let i = 2; i <= 19; i++) {
        try {
            let res = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/category?id=${i}`);
            let category = res.data;

            categories.push({ 
                title: category.title, 
                clueId: category.id, 
                clues: category.clues.map(clue => ({ ...clue, showing: null }))
            });

            // Since some ids return a error, handle it here
        } catch (e) {
            console.log(`Error for category ID ${i}`);
        }
    }

    // Get 6 random category IDs
    const randomIds = getCategoryIds();

    // Get the category's data from the the IDs
    for (let cat of randomIds) {
        randomCategories.push(getCategory(cat));
    }

    // Fill the table with the titles and questions
    fillTable();

    // Now hide the spinner and show the table
    hideLoadingView();  
}

/** On click of start / restart button, set up game. */

// Create the elements that are going to be used
const $h1 = $("<h1>Jeopardy!</h1>");
const $button = $("<button>Start!</button>");
const $divSpinner = $('<div id ="loading-spinner"><img src ="https://i.giphy.com/L05HgB2h6qICDs5Sms.webp"></div>');
const $table = $("<table>", { id: "jeopardy" });

// Append them to the body
$("body").prepend($table);
$("body").prepend($divSpinner);
$("body").prepend($button);
$("body").prepend($h1);

// Add the listener for the button
$("button").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

// Add a listener for the td's
$(document).on("click", "table#jeopardy td", handleClick);