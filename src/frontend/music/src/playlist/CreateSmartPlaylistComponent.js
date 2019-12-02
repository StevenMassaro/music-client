import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import * as lodash from "lodash";
import {ZUUL_ROUTE} from "../App";
import PropTypes from 'prop-types';

const axios = require('axios').default;

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
        axios({
            url: "." + ZUUL_ROUTE + "/playlist/smart",
            method: this.props.existingSmartPlaylist ? "PATCH" : "POST",
            data: song
        })
            .then(() => {
                toast.success("Successfully " + this.state.action + "d smart playlist.");
            })
            .catch((error) => {
                error.text().then(errorMessage => toast.error(<div>Failed to {this.state.action} smart playlist:<br/>{errorMessage}
                </div>));
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
        axios.delete("." + ZUUL_ROUTE + "/playlist/smart/" + this.props.existingSmartPlaylist.id)
            .then(toast.success("Successfully deleted smart playlist."))
            .catch((error) => {
                error.text().then(errorMessage => toast.error(<div>Failed to update
                    delete smart playlist:<br/>{errorMessage}
                </div>));
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
