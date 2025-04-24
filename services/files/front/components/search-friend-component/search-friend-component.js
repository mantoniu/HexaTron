import {ListenerComponent} from "../component/listener-component.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";

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
        this.resultsContainer = this.shadowRoot.getElementById("search-result");
        this.addAutomaticEventListener(userService, USER_EVENTS.SEARCH_RESULT, (results) => {
            this.searchResults = results;
            this.displayResults();
        });

        this.addEventListeners();
    }

    addEventListeners() {
        this.addAutoCleanListener(this.searchInput, "input", this.handleSearchInput.bind(this));
        this.addAutoCleanListener(this.searchInput, "click", this.handleSearchInput.bind(this));

        document.addEventListener("click", (event) => {
            if (!this.contains(event.target) && !this.resultsContainer.contains(event.target)) {
                this.hideResults();
            }
        });
    }

    handleSearchInput(event) {
        event.stopPropagation();
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
        this.resultsContainer.innerHTML = "";

        if (this.searchResults.length === 0) {
            this.resultsContainer.innerHTML = '<div class="no-results">No user found</div>';
            this.showResults();
            return;
        }

        this.searchResults.forEach(user => {
            const element = document.createElement("friend-list-element");
            element.id = user._id;
            element.setPlayer(user);

            this.resultsContainer.appendChild(element);
        });

        this.showResults();
    }

    showResults() {
        this.searchInput.style.borderRadius = "10px 10px 0 0";
        this.searchInput.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";

        const searchBarRect = this.searchInput.getBoundingClientRect();
        this.resultsContainer.style.top = `${this.searchInput.offsetTop + searchBarRect.height}px`;
        this.resultsContainer.style.width = `${searchBarRect.width}px`;
        this.resultsContainer.style.display = "block";
    }

    hideResults() {
        this.searchInput.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        this.searchInput.style.borderRadius = "10px 10px 10px 10px";
        this.resultsContainer.style.display = "none";
    }

    setMinCharsForSearch(count) {
        this.minCharsForSearch = count;
    }
}