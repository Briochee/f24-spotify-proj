// eslint-disable-next-line no-unused-vars
import axios from "axios";

const wordsToIgnore = [
    "of", "to", "into", "onto", "at", "in", "on", "under", "over", "between", 
    "with", "about", "by", "for", "against", "like", 
    "the", "a", "an", 
    "it", "he", "she", "they", "you", "it's", "we", "this", 
    "is", "are", "was", "be", "can", "do", "when", 
    "st.", "ms.", "mr.", "mrs.", "dr.", "sir"
];

function sanitizeValue(value, ignoredWords = []) {
    if (!value) return "";

    return value
        .toLowerCase()
        .replace(/&/g, "and")   // replace & with 'and'
        .replace(/(\(.*?\)|\[.*?\]|\{.*?\})/g, "") // removes content within parentheses, brackets, or braces
        .replace(/\s[-–—]\s.*/, "") // removes ' - anything' constructs
        .replace(/[^a-z0-9\s]/g, "") // removes special characters except for '&'
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter((word, index) => {
            if (index === 0 && ignoredWords.includes(word)) {
                return false;
            }
            return true;
        })
        .join(" ");
}

export function verifyInput(inputValue, correctValue, difficulty, ignoredWords = []) {
    if (difficulty === "hard") {
        const hardInput = inputValue
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/(\(.*?\)|\[.*?\]|\{.*?\})/g, "")
            .replace(/\s[-–—]\s.*/, "")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        const hardCorrect = correctValue
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/(\(.*?\)|\[.*?\]|\{.*?\})/g, "")
            .replace(/\s[-–—]\s.*/, "")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        return hardInput === hardCorrect;
    }

    // Sanitization for easy and medium difficulty
    const sanitizedInput = sanitizeValue(inputValue, wordsToIgnore);
    const sanitizedCorrect = sanitizeValue(correctValue, wordsToIgnore);

    // console.log("Sanitized Input:", sanitizedInput);
    // console.log("Sanitized Correct:", sanitizedCorrect);

    return sanitizedInput === sanitizedCorrect;
}

const toTitle = (str) => {
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export const verifyAnswer = ({ currentSong, userInput, difficulty, isRevealed, }) => {
    const correctSong = currentSong?.name?.toLowerCase() || "";
    const correctArtists = currentSong?.artists?.map(artist => artist.name.toLowerCase()) || [];

    const songTitle = toTitle(correctSong);
    const artistTitles = correctArtists.map(toTitle).join(", ");

    const inputSong = userInput.song.toLowerCase().trim();
    const inputArtist = userInput.artist.toLowerCase().trim();

    let scoreIncrement = 0;
    let penalty = 0;
    let feedbackMessage = "";
    let isCorrect = false;

    // console.log(`${inputSong} by ${inputArtist} vs ${correctSong} by ${correctArtist}`);

    // If no input is provided for either input
    if (!inputSong && !inputArtist) {
        penalty = (difficulty === "easy") ? 2 : (difficulty === "medium") ? 3 : 5;
        feedbackMessage = `${penalty} points deducted. ${songTitle} by ${artistTitles}`;
        return { scoreIncrement, penalty, feedbackMessage, isCorrect };
    }

    const isSongCorrect = verifyInput(correctSong, inputSong, difficulty);
    const isArtistCorrect = correctArtists.some(correctArtist =>
        verifyInput(correctArtist, inputArtist, difficulty)
    );

    // Full correct answer
    if (isSongCorrect && isArtistCorrect) {
        scoreIncrement = 
            difficulty === "easy" ? (isRevealed ? 3 : 5)
            : difficulty === "medium" ? (isRevealed ? 4 : 8)
            : 10;

        feedbackMessage = `Score increased by ${scoreIncrement}!`;
        isCorrect = true;
    } else if (
        //partially correct, one empty input
        isSongCorrect || isArtistCorrect) {
            let correct = isSongCorrect ? `Artist(s): ${artistTitles}` : `Song: ${songTitle}`;
            scoreIncrement = isRevealed
            ? difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 5
            : difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;

        feedbackMessage = `Score increased by ${scoreIncrement}! ${correct}`;
        isCorrect = true;
    } else {
        // both incorrect
        const penalty = (!inputSong || !inputArtist) 
                ? (difficulty === "easy") ? 1 : (difficulty === "medium") ? 2 : 3 
                : (difficulty === "easy") ? 1 : (difficulty === "medium") ? 3 : 5;

        feedbackMessage = `Incorrect! ${penalty} points deducted.`;
        // console.log("Score Increment: ", scoreIncrement, "\nPenalty: ", penalty)
        return { scoreIncrement, penalty, feedbackMessage, isCorrect };
    }

    // console.log("Score Increment: ", scoreIncrement, "\nPenalty: ", penalty)
    return { scoreIncrement, penalty, feedbackMessage, isCorrect };
};
