import {Component} from '../component/component.js';
import {ImageButton} from "../image-button/image-button.js";

export class CustomNav extends Component{
    constructor() {
        super();

        ImageButton.register();
    }
}