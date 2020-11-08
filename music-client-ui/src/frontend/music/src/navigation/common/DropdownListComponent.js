import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import PropTypes from 'prop-types';
import * as lodash from "lodash";
import {api} from "../../App";

class DropdownListComponent extends Component {

    constructor(props){
        super(props);
        this.state = {
            values: undefined
        }
    }

    listValues = () => {
        api.get(this.props.buildServerUrl(this.props.valuesUrl))
            .then(
                (result) => {
                    this.setState({
                        values: result.data
                    });
                })
            .catch(
                () => {
                    toast.error(`Failed to list values for ${this.props.title}`);
                }
            );
    };

    /**
     * List the tracks for the selected value. For example, one might select a particular playlist, and this should
     * fetch the tracks for that playlist and set the active song list to that playlist's array of songs.
     */
    listTracks = (selectedValue) => {
        api.get(this.props.buildServerUrl((this.props.tracksUrl || this.props.valuesUrl) + selectedValue))
            .then(
                (result) => {
                    this.props.setActiveMenuItem(this.props.title + selectedValue);
                    this.props.setActiveSongList(result.data);
                })
            .catch(
                () => {
                    toast.error(`Failed to load songs for ${selectedValue}`);
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
