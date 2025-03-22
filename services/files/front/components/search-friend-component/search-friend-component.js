import {ListenerComponent} from "../component/listener-component.js";
import {userService} from "../../services/user-service.js";

export class SearchFriendComponent extends ListenerComponent {
    constructor() {
        super();
        this.debounceTimeout = null;
        this.searchResults = [];
        this.minCharsForSearch = 4;
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.searchInput = this.shadowRoot.getElementById("search-bar");
        this.searchButton = this.shadowRoot.getElementById("search");
        this.resultsContainer = this.shadowRoot.getElementById("search-result");
        this.addAutomaticEventListener(userService, "searchFriendsResults", (results) => {
            this.searchResults = results;
            this.displayResults();
        });

        this.addEventListeners();
    }

    addEventListeners() {
        this.addAutoCleanListener(this.searchInput, "input", this.handleSearchInput.bind(this));

        this.addAutoCleanListener(this.searchButton, "click", () => {
            this.performSearch(this.searchInput.value);
        });

        document.addEventListener("click", (event) => {
            if (!this.contains(event.target) && !this.resultsContainer.contains(event.target)) {
                this.hideResults();
            }
        });
    }

    handleSearchInput(event) {
        const query = event.target.value.trim();

        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        if (query.length === 0) {
            this.hideResults();
            return;
        }

        if (query.length >= this.minCharsForSearch) {
            this.debounceTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        } else {
            this.hideResults();
        }
    }

    performSearch(query) {
        userService.searchFriends(query);
    }

    displayResults() {
        console.log(this.searchResults);
        this.resultsContainer.innerHTML = "";

        if (this.searchResults.length === 0) {
            this.resultsContainer.innerHTML = "<div class=\"no-results\">Aucun utilisateur trouvé</div>";
            this.showResults();
            return;
        }

        this.searchResults.forEach(user => {
            const element = document.createElement("friend-list-element");
            element.id = user.id;
            element.setPlayer(user);

            this.resultsContainer.appendChild(element);
        });

        this.showResults();
    }

    showResults() {
        const searchBarRect = this.searchInput.getBoundingClientRect();
        this.resultsContainer.style.top = `${searchBarRect.bottom}px`;

        this.resultsContainer.style.display = "block";
    }

    hideResults() {
        this.resultsContainer.style.display = "none";
    }

    setMinCharsForSearch(count) {
        this.minCharsForSearch = count;
    }
}