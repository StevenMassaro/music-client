import React, {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import {ZUUL_ROUTE} from "./App";
import {handleRestResponse} from "./Utils";
import * as lodash from "lodash";

class EditMetadataComponent extends Component {

    constructor(props) {
        super(props);
        let songCopy = Object.assign({}, props.song);
        this.state = {
            modifyableTags: [],
            song: songCopy
        }
    }

    componentDidMount() {
        this.loadModifyableTags();
    }

    loadModifyableTags = () => {
        this.setState({
            loadingModifyableTags: true,
            loadedModifyableTags: false
        });
        fetch("." + ZUUL_ROUTE + "/track/modifyabletags")
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingModifyableTags: false,
                        loadedModifyableTags: true,
                        modifyableTags: result
                    });
                },
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to load modifyable
                        tags:<br/>{errorMessage}</div>));
                    this.setState({
                        loadingModifyableTags: false,
                        loadedModifyableTags: true,
                        errorModifyableTags: error
                    });
                }
            );
    };

    handleSubmit = (event, song) => {
        let songCopy = Object.assign({}, song);
        delete songCopy.target;
        fetch("." + ZUUL_ROUTE + "/track", {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(songCopy)
        })
            .then(handleRestResponse)
            .then(
                (result) => {
                    toast.success("Successfully updated track metadata.");
                    this.props.listSongs();
                },
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to update track metadata:<br/>{errorMessage}
                    </div>));
                }
            );
        event.preventDefault();
    };

    handleInputChange = (propertyName, value) => {
        let song = Object.assign({}, this.state.song);
        lodash.set(song, propertyName, value);
        this.setState({
            song: song
        });
    };

    render() {
        return <form onSubmit={(e) => this.handleSubmit(e, this.state.song)}>
            {this.state.modifyableTags.map(mt =>
                <span>
                    {mt.propertyName}: <input
                    type={mt.htmlType}
                    value={lodash.get(this.state.song, mt.propertyName, "")}
                    onChange={(e) => this.handleInputChange(mt.propertyName, e.target.value)}
                />
                <br/>
                </span>
            )}
            <input type="submit" value="Submit"/>
        </form>;
    }
}

export default EditMetadataComponent;