import React, {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import * as lodash from "lodash";

const axios = require('axios').default;

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
        axios.get(this.props.buildServerUrl("/track/modifyabletags"))
            .then(
                (result) => {
                    this.setState({
                        modifyableTags: result.data
                    });
                })
            .catch(
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to load modifyable
                        tags:<br/>{errorMessage}</div>));
                }
            );
    };

    handleSubmit = (event, song) => {
        let songCopy = Object.assign({}, song);
        delete songCopy.target;
        axios.patch(this.props.buildServerUrl("/track"), songCopy)
            .then(
                () => {
                    toast.success("Successfully updated track metadata.");
                    this.props.listSongs();
                })
            .catch(
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