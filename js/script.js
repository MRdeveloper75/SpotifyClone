let currentSong = new Audio();
let songs = [];
let currFolder;
let currentIndex = 0;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder; // e.g., "songs/ncs"

    try {
        let a = await fetch(`/${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");

        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.toLowerCase().endsWith(".mp3")) {
                let url = new URL(element.href);
                let songname = url.pathname.split("/").pop();
                // Store the relative path to server (do NOT prepend folder again)
                songs.push(songname);
            }
        }

        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            let filename = decodeURIComponent(song)
                .split("/")
                .pop()
                .split("\\")
                .pop();

            let cleanName = filename
                // .replace(/\.[^/.]+$/, "")
                .replaceAll("-", " ")
                .replaceAll("_", " ")
                .trim();

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
        }

        Array.from(document.querySelectorAll(".songList li")).forEach((e, index) => {
            e.addEventListener("click", () => {
                playMusic(songs[index]); // Pass the full path
            });
        });

        return songs;
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

const playMusic = (track, pause = false) => {

    currentIndex = songs.indexOf(track); // 🔥 THIS LINE IMPORTANT

    currentSong.pause();
    currentSong.currentTime = 0;
    currentSong.src = track;

    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }

    let songname = decodeURIComponent(track)
        .split("/")
        .pop()
        .split("\\")
        .pop()
        .replaceAll("-", " ")
        .replaceAll("_", " ")
        .trim();

    document.querySelector(".songinfo").innerHTML = songname;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    let cardContainer = document.querySelector(".cardContainer");
    let folders = ["Angry_(mood)", "Bright(mood)", "Chill_(mood)", "cs", "Dark_(mood)", "Diljit", "Funky_(mood)", "Karan_aujla", "Love_(mood)", "ncs", "Uplifting_(mood)", "kpop demon hunter","Arijit singh","Sad songs","Pakistani ost"];

    cardContainer.innerHTML = "";
    for (const folder of folders) {
        try {
            let a = await fetch(`/songs/${folder}/info.json`);
            let title = folder.replaceAll("_", " ");
            let desc = "Playlist";

            if (a.ok) {
                let response = await a.json();
                title = response.title;
                desc = response.description;
            }

            cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org">
                        <path d="M5 20V4L19 12L5 20Z" fill="#000" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg" onerror="this.src='img/logo.svg'" alt="">
                <h2>${title}</h2>
                <p>${desc}</p>
            </div>`;
        } catch (e) {
            console.log("Card error", e)
        }
    }

    // Card click
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (item) => {
            let folder = item.currentTarget.dataset.folder;
            await getSongs(`songs/${folder}`);
            if (songs.length > 0) playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/ncs");
    if (songs.length > 0) playMusic(songs[0], true);
    await displayAlbums();

    let mainPlayBtn = document.querySelector("#play");
    mainPlayBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            mainPlayBtn.src = "img/pause.svg";
        } else {
            currentSong.pause();
            mainPlayBtn.src = "img/playmusic.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    const previous = document.querySelector("#previous");
    const next = document.querySelector("#next");

    previous.addEventListener("click", () => {
        if (currentIndex > 0) {
            playMusic(songs[currentIndex - 1]);
        }
    });

    next.addEventListener("click", () => {
        if (currentIndex < songs.length - 1) {
            playMusic(songs[currentIndex + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });
}

main();