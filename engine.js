class MundaneEngine {
    constructor() {
        // Initialize Data Directly (Bypassing fetch for file:// support)
        this.data = {
          "schedule": {
            "1": "push",
            "4": "push",
            "2": "pull",
            "5": "pull",
            "3": "legs",
            "6": "legs",
            "0": "recovery"
          },
          "protocols": {
            "push": [
              "chest_press_incline",
              "flyes_flat",
              "seated_db_press"
            ],
            "pull": [
              "one_arm_db_row"
            ],
            "legs": [
              "goblet_squat"
            ],
            "recovery": [
              "treadmill_walk"
            ]
          },
          "library": {
            "chest_press_incline": {
              "name": "Incline DB Press",
              "equipment": "DB + Bench",
              "setting": "30-45 deg",
              "detail": "Focus on upper chest squeeze.",
              "vis_static": "assets/infographics/incline_db_press_nano_banana_1768077765614.png",
              "vis_loop": "https://media.giphy.com/media/26AHG5KGFxSkqlB6w/giphy.gif"
            },
            "flyes_flat": {
              "name": "Flat DB Flyes",
              "equipment": "DB + Bench",
              "setting": "Flat",
              "detail": "Wide arc, 'hugging a tree' motion.",
              "vis_static": "assets/infographics/flat_db_flyes_nano_banana_1768077783120.png",
              "vis_loop": "https://media.giphy.com/media/3o7TjqM7k8wL2J5YQw/giphy.gif"
            },
            "seated_db_press": {
              "name": "Seated DB Press",
              "equipment": "DB + Bench",
              "setting": "Upright",
              "detail": "Vertical press for shoulders.",
              "vis_static": "assets/infographics/seated_db_press_nano_banana_1768077812626.png",
              "vis_loop": "https://media.giphy.com/media/xT9Igv3fJYAi36E2Z2/giphy.gif"
            },
            "one_arm_db_row": {
              "name": "One-Arm DB Row",
              "equipment": "DB + Bench",
              "setting": "Flat",
              "detail": "One knee on bench, pull to hip.",
              "vis_static": "assets/infographics/one_arm_db_row_nano_banana_1768077797587.png",
              "vis_loop": "https://media.giphy.com/media/3o7qD1yK5Y14560jSw/giphy.gif"
            },
            "goblet_squat": {
              "name": "Goblet Squat",
              "equipment": "DB",
              "setting": "N/A",
              "detail": "Vertical DB hold at chest.",
              "vis_static": "assets/infographics/goblet_squat_nano_banana_1768077839347.png",
              "vis_loop": "https://media.giphy.com/media/3o6ozkQbdfOIyCC6w8/giphy.gif"
            },
            "treadmill_walk": {
              "name": "Treadmill Walk",
              "equipment": "Treadmill",
              "setting": "Incline",
              "detail": "Speed 3.5mph, no hands on rails.",
              "vis_static": "assets/infographics/treadmill_walk_nano_banana_1768077825486.png",
              "vis_loop": "https://media.giphy.com/media/l2Je0oOcT4cioSIfu/giphy.gif"
            }
          }
        };
        
        this.schedule = null;
        this.currentProtocol = null;
        this.workoutQueue = [];
        this.currentIndex = 0;
        this.timerInterval = null;
        this.timeLeft = 0;
        this.isResting = false;
        
        // Constants
        this.WORK_TIME = 45; // seconds per set - demo value, usually longer
        this.REST_TIME = 15; // seconds rest
        
        // DOM Elements
        this.views = {
            landing: document.getElementById('landing-view'),
            workout: document.getElementById('workout-view'),
            completed: document.getElementById('completed-view')
        };
        
        this.elements = {
            todayProtocol: document.getElementById('today-protocol'),
            startBtn: document.getElementById('start-btn'),
            exerciseName: document.getElementById('current-exercise-name'),
            timeDisplay: document.getElementById('time-remaining'),
            loopDisplay: document.getElementById('loop-display'),
            staticDisplay: document.getElementById('static-display'),
            equipmentTag: document.getElementById('equipment-tag'),
            settingTag: document.getElementById('setting-tag'),
            detailText: document.getElementById('exercise-detail'),
            upNext: document.getElementById('up-next-display'),
            progressFill: document.getElementById('progress-fill')
        };

        this.speech = new SpeechSynthesisUtterance();
        this.speech.rate = 1.0;
        this.speech.pitch = 1.0;

        this.init();
    }

    async init() {
        // await this.loadData(); // Removed for local file support
        this.detectProtocol();
        this.setupListeners();
    }
/*
    async loadData() {
        const response = await fetch('exercises.json');
        this.data = await response.json();
    }
*/

    detectProtocol() {
        const day = new Date().getDay(); // 0 is Sunday
        const protocolKey = this.data.schedule[day.toString()];
        this.currentProtocol = protocolKey;
        this.elements.todayProtocol.textContent = `TODAY: ${protocolKey.toUpperCase()} PROTOCOL`;
        
        // Build Queue
        // For demo purposes, we loop specific exercises based on protocol
        // In a real app, you'd have sets/reps structure. 
        // We will just create a flat list of all exercises in the protocol for now.
        const protocolExercises = this.data.protocols[protocolKey];
        if (protocolExercises) {
           this.workoutQueue = protocolExercises.map(id => this.data.library[id]);
        }
    }

    setupListeners() {
        this.elements.startBtn.addEventListener('click', () => {
            // Unlock Audio Context (Mobile Safari requirement)
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
            this.startWorkout();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            location.reload();
        });
    }

    startWorkout() {
        this.switchView('workout');
        this.currentIndex = 0;
        this.runExercise(this.currentIndex);
    }

    runExercise(index) {
        if (index >= this.workoutQueue.length) {
            this.finishWorkout();
            return;
        }

        const exercise = this.workoutQueue[index];
        this.updateUI(exercise);
        
        // Voice Prompt
        this.speak(`Next up. ${exercise.name}. ${exercise.detail}`);
        
        // Start Timer
        // We can do a prep time of 5s then work
        this.isResting = true; // Technically prep is like rest/setup
        this.startTimer(5, () => {
             this.speak("Begin.");
             this.isResting = false;
             this.startTimer(this.WORK_TIME, () => {
                 this.speak("Rest.");
                 if (index < this.workoutQueue.length - 1) {
                     // Next
                     this.currentIndex++;
                     this.runExercise(this.currentIndex);
                 } else {
                     this.finishWorkout();
                 }
             });
        });
    }

    updateUI(exercise) {
        this.elements.exerciseName.textContent = exercise.name;
        this.elements.equipmentTag.textContent = exercise.equipment;
        this.elements.settingTag.textContent = exercise.setting || 'N/A';
        this.elements.detailText.textContent = exercise.detail;
        
        // Assets
        this.elements.loopDisplay.src = exercise.vis_loop;
        this.elements.staticDisplay.src = exercise.vis_static;
        
        // Up Next
        const nextEx = this.workoutQueue[this.currentIndex + 1];
        this.elements.upNext.textContent = nextEx ? `NEXT: ${nextEx.name.toUpperCase()}` : "NEXT: COOL DOWN";
    }

    startTimer(seconds, onComplete) {
        this.timeLeft = seconds;
        this.updateTimerDisplay();
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const totalTime = seconds;
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Progress Bar
            const percent = ((totalTime - this.timeLeft) / totalTime) * 100;
            this.elements.progressFill.style.width = `${percent}%`;

            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                if (onComplete) onComplete();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const m = Math.floor(this.timeLeft / 60);
        const s = this.timeLeft % 60;
        this.elements.timeDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        // Color changes for last 3 seconds
        if (this.timeLeft <= 3) {
            this.elements.timeDisplay.style.color = '#ff4444';
        } else {
            this.elements.timeDisplay.style.color = '#ffffff';
        }
    }

    speak(text) {
        this.speech.text = text;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(this.speech);
    }

    switchView(viewName) {
        Object.values(this.views).forEach(el => el.classList.remove('active'));
        this.views[viewName].classList.add('active');
    }

    finishWorkout() {
        this.switchView('completed');
        this.speak("Workout complete. Great job.");
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    new MundaneEngine();
});
