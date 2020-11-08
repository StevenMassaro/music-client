import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import * as lodash from "lodash";
import PropTypes from 'prop-types';
import {api} from "../App";

class CreateSmartPlaylistComponent extends Component {

    constructor(props) {
        super(props);
        let existing = Object.assign({}, this.props.existingSmartPlaylist);
        this.state = {
            smartPlaylist: existing,
            action: this.props.existingSmartPlaylist ? "update" : "create"
        }
    }

    handleSubmit = (event, song) => {
        api({
            url: this.props.buildServerUrl("/playlist/smart"),
            method: this.props.existingSmartPlaylist ? "PATCH" : "POST",
            data: song
        })
            .then(() => {
                toast.success("Successfully " + this.state.action + "d smart playlist.");
            });
        event.preventDefault();
    };

    handleInputChange = (propertyName, value) => {
        let smartPlaylist = Object.assign({}, this.state.smartPlaylist);
        lodash.set(smartPlaylist, propertyName, value);
        this.setState({
            smartPlaylist: smartPlaylist
        });
    };

    deleteEntry = () => {
        api.delete(this.props.buildServerUrl("/playlist/smart/" + this.props.existingSmartPlaylist.id))
            .then(() => toast.success("Successfully deleted smart playlist."))
            .catch(() => {
                toast.error("Failed to delete smart playlist");
            });
    };

    render() {
        const name = "name";
        const dynamicSql = "dynamicSql";
        return <>
            <form onSubmit={(e) => this.handleSubmit(e, this.state.smartPlaylist)}>
                <span>
                    Name: <input
                    type={"text"}
                    value={lodash.get(this.state.smartPlaylist, name, "")}
                    onChange={(e) => this.handleInputChange(name, e.target.value)}
                />
                <br/>
                Dynamic SQL: WHERE<input
                    type={"text"}
                    value={lodash.get(this.state.smartPlaylist, dynamicSql, "")}
                    onChange={(e) => this.handleInputChange(dynamicSql, e.target.value)}
                />
                </span>
            <br/>
            <input type="submit" value={lodash.startCase(this.state.action)}/>
            <br/>
            <br/>
        </form>
        {this.props.existingSmartPlaylist && <button onClick={this.deleteEntry}>Delete</button>}
        </>
    }
}

CreateSmartPlaylistComponent.propTypes = {
    existingSmartPlaylist: PropTypes.object
};

CreateSmartPlaylistComponent.defaultProps = {
    existingSmartPlaylist: {
        name: undefined,
        dynamicSql: undefined
    }
};

export default CreateSmartPlaylistComponent;
