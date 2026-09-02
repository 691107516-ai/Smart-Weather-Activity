const API_URL = "https://openlibrary.org/search.json";

const PLACEHOLDER_IMAGE =
    "https://via.placeholder.com/300x450?text=No+Cover";


/*
    ข้อมูลหนังสือทั้งหมดที่โหลดจาก API
    Filter และ Sort จะทำกับตัวแปรนี้
    จึงไม่ต้องเรียก API ใหม่
*/
let allBooks = [];


/*
    รายการโปรด
    โหลดจาก localStorage ตอนเริ่มต้น
*/
let favorites =
    JSON.parse(
        localStorage.getItem("favoriteBooks")
    ) || [];


/* DOM */

const keywordInput =
    document.querySelector("#keyword");

const searchType =
    document.querySelector("#searchType");

const searchBtn =
    document.querySelector("#searchBtn");

const yearFilter =
    document.querySelector("#yearFilter");

const sortSelect =
    document.querySelector("#sortSelect");

const emptyState =
    document.querySelector("#emptyState");

const loadingState =
    document.querySelector("#loadingState");

const errorState =
    document.querySelector("#errorState");

const errorMessage =
    document.querySelector("#errorMessage");

const resultSection =
    document.querySelector("#resultSection");

const booksGrid =
    document.querySelector("#booksGrid");

const resultCount =
    document.querySelector("#resultCount");

const favoritesGrid =
    document.querySelector("#favoritesGrid");

const favoriteCount =
    document.querySelector("#favoriteCount");

const favoriteEmpty =
    document.querySelector("#favoriteEmpty");


/* State */

function showState(state) {

    emptyState.classList.add("hidden");
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    resultSection.classList.add("hidden");

    state.classList.remove("hidden");
}


/* Search */

async function searchBooks() {

    const keyword =
        keywordInput.value.trim();

    if (!keyword) {

        errorMessage.textContent =
            "กรุณากรอกคำค้นก่อนค้นหา";

        showState(errorState);

        return;
    }


    showState(loadingState);

    searchBtn.disabled = true;


    let searchParameter = "";


    if (searchType.value === "title") {

        searchParameter =
            `title=${encodeURIComponent(keyword)}`;

    } else if (searchType.value === "author") {

        searchParameter =
            `author=${encodeURIComponent(keyword)}`;

    } else {

        searchParameter =
            `q=${encodeURIComponent(keyword)}`;

    }


    const url =
        `${API_URL}?${searchParameter}&limit=10`;


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `API Error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data.docs)) {

            throw new Error(
                "รูปแบบข้อมูลจาก API ไม่ถูกต้อง"
            );

        }


        /*
            เก็บข้อมูล API ไว้ใน allBooks
            เพื่อใช้ Filter และ Sort
        */

        allBooks = data.docs;


        resultCount.textContent =
            data.numFound ?? allBooks.length;


        resultSection.classList.remove(
            "hidden"
        );

        emptyState.classList.add("hidden");


        renderBooks();


    } catch (error) {

        console.error(error);

        errorMessage.textContent =
            "ไม่สามารถค้นหาหนังสือได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";

        showState(errorState);

    } finally {

        searchBtn.disabled = false;

    }
}


/* Filter */

function filterBooks(books) {

    const filter =
        yearFilter.value;


    if (filter === "all") {

        return books;

    }


    return books.filter(book => {

        const year =
            book.first_publish_year;


        if (!year) {
            return false;
        }


        if (filter === "before2000") {
            return year < 2000;
        }


        if (filter === "2000-2010") {
            return year >= 2000 && year <= 2010;
        }


        if (filter === "2011-2020") {
            return year >= 2011 && year <= 2020;
        }


        if (filter === "after2020") {
            return year >= 2021;
        }


        return true;

    });
}


/* Sort */

function sortBooks(books) {

    const sortedBooks =
        [...books];


    switch (sortSelect.value) {

        case "title-asc":

            sortedBooks.sort((a, b) => {

                const titleA =
                    a.title || "";

                const titleB =
                    b.title || "";

                return titleA.localeCompare(
                    titleB
                );

            });

            break;


        case "title-desc":

            sortedBooks.sort((a, b) => {

                const titleA =
                    a.title || "";

                const titleB =
                    b.title || "";

                return titleB.localeCompare(
                    titleA
                );

            });

            break;


        case "year-desc":

            sortedBooks.sort((a, b) => {

                return (
                    (b.first_publish_year || 0) -
                    (a.first_publish_year || 0)
                );

            });

            break;


        case "year-asc":

            sortedBooks.sort((a, b) => {

                return (
                    (a.first_publish_year || 0) -
                    (b.first_publish_year || 0)
                );

            });

            break;
    }


    return sortedBooks;
}


/*
    Render
    Filter → Sort → สร้าง Card
*/

function renderBooks() {

    const filteredBooks =
        filterBooks(allBooks);


    const sortedBooks =
        sortBooks(filteredBooks);


    booksGrid.innerHTML = "";


    if (sortedBooks.length === 0) {

        booksGrid.innerHTML =
            `<div class="state">
                <p>ไม่พบหนังสือในช่วงปีที่เลือก</p>
            </div>`;

        return;
    }


    sortedBooks.forEach(book => {

        const card =
            createBookCard(book);

        booksGrid.appendChild(card);

    });
}


/* Create Book Card */

function createBookCard(book) {

    const card =
        document.createElement("article");

    card.classList.add("book-card");


    const title =
        book.title ||
        "ไม่ระบุชื่อหนังสือ";


    const authors =
        Array.isArray(book.author_name)
            ? book.author_name.join(", ")
            : "ไม่ระบุผู้แต่ง";


    const year =
        book.first_publish_year ??
        "-";


    const editions =
        book.edition_count ??
        0;


    let coverUrl =
        PLACEHOLDER_IMAGE;


    if (book.cover_i) {

        coverUrl =
            `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;

    }


    const isFavorite =
        favorites.some(
            favorite =>
                favorite.key === book.key
        );


    /*
        ใช้ createElement()
        และ textContent
        แทนการนำข้อมูลจาก API
        ไปต่อ HTML โดยตรง
    */

    const coverContainer =
        document.createElement("div");

    coverContainer.classList.add(
        "cover-container"
    );


    const image =
        document.createElement("img");

    image.src = coverUrl;

    image.alt =
        `ปกหนังสือ ${title}`;


    image.onerror = () => {

        image.src =
            PLACEHOLDER_IMAGE;

    };


    coverContainer.appendChild(image);


    const info =
        document.createElement("div");

    info.classList.add("book-info");


    const titleElement =
        document.createElement("h3");

    titleElement.classList.add(
        "book-title"
    );

    titleElement.textContent =
        title;


    const authorElement =
        document.createElement("p");

    authorElement.textContent =
        `👤 ผู้แต่ง: ${authors}`;


    const yearElement =
        document.createElement("p");

    yearElement.textContent =
        `📅 ปีพิมพ์ครั้งแรก: ${year}`;


    const editionElement =
        document.createElement("p");

    editionElement.textContent =
        `📚 จำนวนฉบับ: ${editions}`;


    info.appendChild(titleElement);
    info.appendChild(authorElement);
    info.appendChild(yearElement);
    info.appendChild(editionElement);


    const favoriteButton =
        document.createElement("button");

    favoriteButton.classList.add(
        "favorite-btn"
    );


    if (isFavorite) {

        favoriteButton.textContent =
            "♥ อยู่ในรายการโปรด";

        favoriteButton.classList.add(
            "saved"
        );

    } else {

        favoriteButton.textContent =
            "♡ เพิ่มรายการโปรด";

    }


    favoriteButton.addEventListener(
        "click",
        () => toggleFavorite(book)
    );


    card.appendChild(coverContainer);
    card.appendChild(info);
    card.appendChild(favoriteButton);


    return card;
}


/* Favorite */

function toggleFavorite(book) {

    const index =
        favorites.findIndex(
            favorite =>
                favorite.key === book.key
        );


    if (index === -1) {

        /*
            เก็บเฉพาะข้อมูลที่จำเป็น
            ลง localStorage
        */

        favorites.push({

            key: book.key,

            title:
                book.title ||
                "ไม่ระบุชื่อหนังสือ",

            author_name:
                book.author_name || [],

            first_publish_year:
                book.first_publish_year ??
                null,

            edition_count:
                book.edition_count ??
                0,

            cover_i:
                book.cover_i ??
                null

        });

    } else {

        favorites.splice(index, 1);

    }


    saveFavorites();

    renderBooks();

    renderFavorites();
}


function saveFavorites() {

    localStorage.setItem(
        "favoriteBooks",
        JSON.stringify(favorites)
    );

}


/* Render Favorites */

function renderFavorites() {

    favoritesGrid.innerHTML = "";


    favoriteCount.textContent =
        `${favorites.length} รายการ`;


    if (favorites.length === 0) {

        favoriteEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    favoriteEmpty.classList.add(
        "hidden"
    );


    favorites.forEach(book => {

        const card =
            createBookCard(book);

        favoritesGrid.appendChild(card);

    });
}


/* Events */

searchBtn.addEventListener(
    "click",
    searchBooks
);


keywordInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            searchBooks();
        }

    }
);


/*
    สำคัญ:
    เปลี่ยน Filter / Sort
    จะเรียก renderBooks()
    ไม่ได้เรียก searchBooks()
*/

yearFilter.addEventListener(
    "change",
    renderBooks
);


sortSelect.addEventListener(
    "change",
    renderBooks
);


/* Initial */

renderFavorites();
