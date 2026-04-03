let currentSong = new Audio();
let songs = [];
let currFolder;
let currentIndex = 0;

// Helper: Seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fixed getSongs: GitHub Pages par folder fetch nahi hota
// Iska behtareen hal ye hai ke aap har folder mein ek 'info.json' rakhein 
// jis mein us folder ke gaano ki list ho.
async function getSongs(folder) {
    currFolder = folder; 
    try {
        // GitHub Pages fix: Folder URL ke bajaye JSON file se list lein
        let response = await fetch(`./${folder}/info.json`);
        if (!response.ok) throw new Error("Folder info not found");
        
        let data = await response.json();
        
        // Maan lete hain ke aapke info.json mein ek "songs" array hai
        // Example info.json: { "title": "NCS", "songs": ["song1.mp3", "song2.mp3"] }
        songs = data.songs; 

        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        
        songs.forEach((song, index) => {
            let cleanName = song.replaceAll("-", " ").replaceAll("_", " ").replace(".mp3", "");
            
            songUL.innerHTML += `<li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${cleanName}</div>
                    <div>Mahnoor</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/playmusic.svg" width="25" alt="">
                </div>
            </li>`;
        });

        // Add event listeners
        Array.from(document.querySelectorAll(".songList li")).forEach((e, index) => {
            e.addEventListener("click", () => {
                playMusic(songs[index]);
            });
        });

        return songs;
    } catch (e) {
        console.error("GitHub Pages doesn't support folder fetching. Please use info.json", e);
    }
}

const playMusic = (track, pause = false) => {
    // Path correctly set for GitHub Pages
    let trackPath = `./${currFolder}/${track}`;
    
    currentIndex = songs.indexOf(track);
    currentSong.src = trackPath;

    if (!pause) {
        currentSong.play().catch(e => console.log("Playback failed:", e));
        document.getElementById("play").src = "img/pause.svg";
    }

    let songname = track.replaceAll("-", " ").replaceAll("_", " ").replace(".mp3", "");
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(songname);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    let cardContainer = document.querySelector(".cardContainer");
    // Aapki folders list
    let folders = ["Angry_(mood)", "Bright(mood)", "Chill_(mood)", "cs", "Dark_(mood)", "Diljit", "Funky_(mood)", "Karan_aujla", "Love_(mood)", "ncs", "Uplifting_(mood)", "kpop_demon_hunter","Arijit_singh","Sad_songs","Pakistani_ost"]; 

    cardContainer.innerHTML = "";
    for (const folder of folders) {
        try {
            // Path fix: Use relative path './'
            let a = await fetch(`./songs/${folder}/info.json`);
            let title = folder.replaceAll("_", " ");
            let desc = "Playlist";

            if (a.ok) {
                let response = await a.json();
                title = response.title || title;
                desc = response.description || desc;
            }

            cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                <div class="play">
                    <img class="play_music" src="img/play_music.svg" alt="">
                </div>
                <img class="cover" src="./songs/${folder}/cover.jpg" onerror="this.src='img/logo.svg'" alt="">
                <h2>${title}</h2>
                <p>${desc}</p>
            </div>`;
        } catch (e) {
            console.log("Card error", e);
        }
    }

    // Card click event
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (item) => {
            let folderName = item.currentTarget.dataset.folder;
            await getSongs(`songs/${folderName}`);
            if (songs.length > 0) playMusic(songs[0]);
        });
    });
}

// Main logic
async function main() {
    await displayAlbums();
    await getSongs("songs/ncs");
    if (songs.length > 0) playMusic(songs[0], true);

    // Play/Pause
    document.querySelector("#play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.querySelector("#play").src = "img/pause.svg";
        } else {
            currentSong.pause();
            document.querySelector("#play").src = "img/playmusic.svg";
        }
    });

    // Seekbar & Timeupdate
    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // UI Controls (Hamburger/Volume/Next/Prev)
    document.querySelector(".hamburger").addEventListener("click", () => { document.querySelector(".left").style.left = "0"; });
    document.querySelector(".close").addEventListener("click", () => { document.querySelector(".left").style.left = "-120%"; });

    document.querySelector("#previous").addEventListener("click", () => {
        if (currentIndex > 0) playMusic(songs[currentIndex - 1]);
    });

    document.querySelector("#next").addEventListener("click", () => {
        if (currentIndex < songs.length - 1) playMusic(songs[currentIndex + 1]);
    });

    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });
}

main();