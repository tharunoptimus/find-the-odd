#! /usr/bin/env node

const cliSelect = require("cli-select");
const clear = require('console-clear');
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const pathToWords = path.join(__dirname, "words.txt");
const datamuse = require("datamuse");

let points = 0;
let index;
let globalWord;

function createRandomNumber() {
	return Math.floor(Math.random() * 3) + 1;
}

function onErr(err) {
	console.log(err);
	return 1;
}

function printHeading(string) {
    let numberOfDashes = string.length;
    let dashes = "-";
    dashes = dashes.repeat(numberOfDashes)

    console.log(chalk.hex("#f1c40f")(dashes));
    console.log(chalk.hex("#d35400")(string));
    console.log(chalk.hex("#f1c40f")(dashes));
}

function createOptions(optionWords, anotherWord) {
	let options = [];
	for (let i = 0; i < 3; i++) {
		options.push(optionWords[i]);
	}
	let randomNumber = createRandomNumber();
	options.splice(randomNumber, 0, anotherWord);
	index = randomNumber;
	return options;
}

async function generateRandomEnglishWord() {
	return await getRandomWord();
}

async function getRandomWord() {
	return new Promise((resolve) => {
		fs.readFile(pathToWords, "utf8", function (err, data) {
			if (err) throw err;
			let words = data.split("\n");
			let randomNumber = Math.floor(Math.random() * words.length);
			resolve(words[randomNumber]);
		});
	});
}

async function getSimilarWords(word) {
	let optionWords = [];

	await datamuse
		.request(`words?ml=${word}&max=3`)
		.then((json) => {
			json.forEach((data) => {
				optionWords.push(data.word);
			});
		})
		.catch((err) => onErr(err));

	return optionWords;
}

async function optionsToSelect() {
	let word = await generateRandomEnglishWord();
    globalWord = word;
    
	console.log(
		chalk.hex("#00a8ff")(`Find the word which is not related to '${word}'`)
	);
    process.stdout.write("Fetching the words...")
	let optionWords = await getSimilarWords(word);
	let anotherWord = await generateRandomEnglishWord();

	return createOptions(optionWords, anotherWord);
}

async function main(correct = false) {
    clear(true);
    if(correct) printHeading(`Awesome! That was correct! Now try another one! Points: ${points}`)
	let option = await optionsToSelect();
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
	cliSelect(
		{
			values: option,
			valueRenderer: (value, selected) => {
				if (selected) {
					return chalk.underline(value);
				}

				return value;
			},
		},
		(value) => {
			if (value.id === index) {
				console.log(chalk.hex("#0F9D58")("Correct!"));
				points++;
				main(true);
			} else {
				console.log(chalk.hex("#DB4437")(`Wrong! '${value.value}' is related to '${globalWord}'`));
				console.log(
					chalk.hex("#F4B400")("You got ", points, " points!")
				);
				console.log(chalk.blue("Thank you for playing!"));
			}
		}
	);
}

main();