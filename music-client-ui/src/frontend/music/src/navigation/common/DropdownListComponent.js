import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import PropTypes from 'prop-types';
import * as lodash from "lodash";

const axios = require('axios').default;

class DropdownListComponent extends Component {

    constructor(props){
        super(props);
        this.state = {
            values: undefined
        }
    }

    listValues = () => {
        this.setState({
            loadingValues: true,
            loadedValues: false
        });
        axios.get(this.props.buildServerUrl(this.props.valuesUrl))
            .then(
                (result) => {
                    this.setState({
                        loadingValues: false,
                        loadedValues: true,
                        values: result.data
                    });
                })
            .catch(
                (error) => {
                    this.setState({
                        loadingValues: false,
                        loadedValues: true,
                        errorValues: error
                    });
                    error.text().then(errorMessage => toast.error(<div>Failed to list {this.props.title}:<br/>{errorMessage}</div>));
                }
            );
    };

    /**
     * List the tracks for the selected value. For example, one might select a particular playlist, and this should
     * fetch the tracks for that playlist and set the active song list to that playlist's array of songs.
     */
    listTracks = (selectedValue) => {
        this.setState({
            loadingTracks: true,
            loadedTracks: false
        });
        axios.get(this.props.buildServerUrl((this.props.tracksUrl || this.props.valuesUrl) + selectedValue))
            .then(
                (result) => {
                    this.props.setActiveMenuItem(this.props.title + selectedValue);
                    this.props.setActiveSongList(result.data);
                })
            .catch(
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to load songs for {selectedValue}:<br/>{errorMessage}</div>));
                }
            );
    };

    _isActive = (item) => this.props.activeMenuItem === this.props.title + item;

    _dropdownOnClick = (val) => {
        let onc = () => this.listTracks(val);
        if (this.props.dropdownOnClickCallback) {
            onc = () => this.props.dropdownOnClickCallback();
        }
        return onc;
    };

    render() {
        return (
            <Dropdown item scrolling text={this.props.title}
                onClick={this.listValues}
            >
                <Dropdown.Menu>
                    {this.state.values && this.state.values.map(value => {
                        let val = this.props.valueGetter(value);
                        let text = this.props.textGetter(value);
                        return <Dropdown.Item text={text}
                                              onClick={() => {
                                                  if (lodash.isFunction(this.props.dropdownOnClickCallback)) {
                                                      return this.props.dropdownOnClickCallback(value);
                                                  }
                                                  return this.listTracks(val);
                                              }}
                                              key={val}
                                              active={this._isActive(val)}
                        />;
                    })
                    }
                </Dropdown.Menu>
            </Dropdown>
        )
    }
}

DropdownListComponent.propTypes = {
    title: PropTypes.string.isRequired,
    valuesUrl: PropTypes.string.isRequired,
    valueGetter: PropTypes.func,
    textGetter: PropTypes.func,
    tracksUrl: PropTypes.string,
    activeMenuItem: PropTypes.string.isRequired,
    setActiveMenuItem: PropTypes.func.isRequired,
    setActiveSongList: PropTypes.func.isRequired,
    dropdownOnClickCallback: PropTypes.func,
    buildServerUrl: PropTypes.func.isRequired
};

DropdownListComponent.defaultProps = {
    valueGetter: (value) => value,
    textGetter: (value) => value
};

export default DropdownListComponent;
