document.addEventListener('DOMContentLoaded', function () {
    // Handle dark mode preference at the start
    if (localStorage.getItem('color-theme') === 'dark' || 
        (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Theme toggle elements from the DOM
    var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    var themeToggleBtn = document.getElementById('theme-toggle');

    // Set the correct theme toggle icon on page load
    if (document.documentElement.classList.contains('dark')) {
        themeToggleLightIcon.classList.remove('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
    }

    // Toggle theme event listener
    themeToggleBtn.addEventListener('click', function() {
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        // Toggle and store color theme preference
        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            }
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            }
        }
    });

    // Handle manual mode toggle
    var manualModeSwitch = document.getElementById('manualModeSwitch');
    var openaiTTFBElement = document.querySelector('.ttfb-openai');
    if (manualModeSwitch) {
        manualModeSwitch.addEventListener('change', function() {
            // Toggle OpenAI TTFB visibility
            openaiTTFBElement.style.display = this.checked ? 'none' : 'block';
        });
    }

    // Toggle Audio Routing
    document.getElementById('AudioOutputSwitch').addEventListener('change', function() {
        var audioPlayerContainer = document.getElementById('audioPlayerContainer');

        // Show or hide the HTML5 audio player based on the toggle state
        audioPlayerContainer.classList.toggle('hidden', this.checked);
    });

    // Start streaming button functionality
    var startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', function() {
            const prompt = document.getElementById('promptText').value;
            const manualMode = manualModeSwitch.checked;
            const sendToA2F = document.getElementById('AudioOutputSwitch').checked;

            // API call to start streaming
            fetch('/startStreaming', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, manualMode, sendToA2F }),
            })
            .then(response => {
                if (!sendToA2F) {
                    response.blob().then(blob => {
                        const audioPlayer = document.getElementById('audioPlayer');
                        audioPlayer.src = URL.createObjectURL(blob);
                        audioPlayer.play();

                        // Update TTFB values from response headers
                        document.getElementById('openaiTTFBValue').innerText = `${response.headers.get('X-ChatGpt-TTFB') || 'N/A'} ms`;
                        document.getElementById('playhtTTFBValue').innerText = `${response.headers.get('X-PlayHT-TTFB') || 'N/A'} ms`;
                    });
                } else {
                    response.json().then(data => {
                        // Update TTFB values from JSON response
                        document.getElementById('openaiTTFBValue').innerText = `${data.chatGptTTFB || 'N/A'} ms`;
                        document.getElementById('playhtTTFBValue').innerText = `${data.playHTTTFB || 'N/A'} ms`;
                    });
                }
            })
            .catch((error) => {
                // Error handling
                console.error('Error:', error);
                startButton.textContent = 'Generate & Send';
                startButton.disabled = false;
                alert('An error occurred. Please try again.');
            });
        });
    }
});
