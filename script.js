document.addEventListener('DOMContentLoaded', () => {
    const gridDisplay = document.querySelector('#grid');
    const solveBtn = document.querySelector('#solve-btn');
    const checkBtn = document.querySelector('#check-btn');
    const generateBtn = document.querySelector('#generate-btn');
    const clearBtn = document.querySelector('#clear-btn');
    const pauseBtn = document.querySelector('#pause-btn'); 
    const timerDisplay = document.querySelector('#timer');

    let timerInterval;
    let seconds = 0;
    let isPaused = false;

    // 1. Initialize 81 Input Fields
    for (let i = 0; i < 81; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 1;
        input.max = 9;
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 1) e.target.value = e.target.value.slice(0, 1);
            if (e.target.value === "0") e.target.value = "";
        });
        gridDisplay.appendChild(input);
    }
    const inputs = document.querySelectorAll('input');

    // 2. Timer Management
    function startTimer() {
        clearInterval(timerInterval);
        seconds = 0;
        isPaused = false;
        pauseBtn.innerText = "Pause";
        gridDisplay.classList.remove('paused');
        timerInterval = setInterval(tick, 1000);
    }

    function tick() {
        seconds++;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `Time: ${m}:${s}`;
    }

    // 3. Pause Logic
    pauseBtn.addEventListener('click', () => {
        if (seconds === 0) return;
        isPaused = !isPaused;
        if (isPaused) {
            clearInterval(timerInterval);
            pauseBtn.innerText = "Resume";
            gridDisplay.classList.add('paused');
        } else {
            timerInterval = setInterval(tick, 1000);
            pauseBtn.innerText = "Pause";
            gridDisplay.classList.remove('paused');
        }
    });

    // 4. DSA Logic (Validation & MRV Solver)
    function isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
            if (board[i][col] === num) return false;
            const boxR = 3 * Math.floor(row / 3) + Math.floor(i / 3);
            const boxC = 3 * Math.floor(col / 3) + i % 3;
            if (board[boxR][boxC] === num) return false;
        }
        return true;
    }

    function countLegalMoves(board, row, col) {
        let count = 0;
        for (let n = 1; n <= 9; n++) {
            if (isValid(board, row, col, n)) count++;
        }
        return count;
    }

    function getBestCell(board) {
        let minMoves = 10;
        let bestCell = null;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    let moves = countLegalMoves(board, r, c);
                    if (moves < minMoves) {
                        minMoves = moves;
                        bestCell = { r, c };
                    }
                }
            }
        }
        return bestCell;
    }

    function solve(board) {
        const cell = getBestCell(board);
        if (!cell) return true;
        const { r, c } = cell;
        for (let num = 1; num <= 9; num++) {
            if (isValid(board, r, c, num)) {
                board[r][c] = num;
                if (solve(board)) return true;
                board[r][c] = 0;
            }
        }
        return false;
    }

    // 5. Leaderboard Functions (API Interaction)
    async function updateLeaderboard() {
        try {
            const response = await fetch('http://localhost:3000/scores');
            const scores = await response.json();
            const body = document.getElementById('leaderboard-body');
            body.innerHTML = scores.map(s => `<tr><td>${s.name}</td><td>${s.time}s</td></tr>`).join('');
        } catch (err) {
            console.error("Leaderboard server is not responding.");
        }
    }

    // 6. Button Listeners
    generateBtn.addEventListener('click', () => {
        let board = Array.from({ length: 9 }, () => Array(9).fill(0));
        
        const fillRandom = (b) => {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (b[r][c] === 0) {
                        let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
                        for (let n of nums) {
                            if (isValid(b, r, c, n)) {
                                b[r][c] = n;
                                if (fillRandom(b)) return true;
                                b[r][c] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };

        fillRandom(board);
        let holes = 45; 
        while (holes > 0) {
            let idx = Math.floor(Math.random() * 81);
            let r = Math.floor(idx / 9), c = idx % 9;
            if (board[r][c] !== 0) { board[r][c] = 0; holes--; }
        }

        inputs.forEach((input, i) => {
            const val = board[Math.floor(i / 9)][i % 9];
            input.value = val === 0 ? "" : val;
            input.readOnly = val !== 0;
            input.style.color = val !== 0 ? "#2980b9" : "black";
            input.style.fontWeight = val !== 0 ? "bold" : "normal";
        });
        startTimer();
    });

    solveBtn.addEventListener('click', () => {
        if (isPaused) return; 
        let board = getBoardFromUI();
        if (solve(board)) {
            updateUI(board);
            clearInterval(timerInterval);
        } else {
            alert("No valid solution found!");
        }
    });

    checkBtn.addEventListener('click', async () => {
        let board = getBoardFromUI();
        if (board.some(row => row.includes(0))) return alert("Finish the board first!");
        
        let valid = true;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                let val = board[r][c];
                board[r][c] = 0;
                if (!isValid(board, r, c, val)) valid = false;
                board[r][c] = val;
            }
        }

        if (valid) {
            clearInterval(timerInterval);
            const name = prompt("You won! Enter your name for the leaderboard:");
            if (name) {
                await fetch('http://localhost:3000/save-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, time: seconds })
                });
                updateLeaderboard();
            }
        } else {
            alert("Errors found!");
        }
    });

    clearBtn.addEventListener('click', () => {
        inputs.forEach(input => { if (!input.readOnly) input.value = ""; });
    });

    function getBoardFromUI() {
        let board = [];
        for (let i = 0; i < 9; i++) {
            board.push([]);
            for (let j = 0; j < 9; j++) {
                const val = inputs[i * 9 + j].value;
                board[i].push(val === "" ? 0 : parseInt(val));
            }
        }
        return board;
    }

    function updateUI(board) {
        inputs.forEach((input, i) => {
            input.value = board[Math.floor(i / 9)][i % 9];
        });
    }

    // Load initial scores
    updateLeaderboard();
});