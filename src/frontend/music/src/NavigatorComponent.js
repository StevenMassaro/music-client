import React, {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import {Dropdown, Icon, Input, Menu} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import {ZUUL_ROUTE} from "./App";
import {handleRestResponse} from "./Utils";

export const SONGS = 'Songs';

class NavigatorComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            activeItem: 'Songs'
        }
    }

    listHistoricalDates = (date) => {
        this.setState({
            loadingHistoricalDates: true,
            loadedHistoricalDates: false
        });
        fetch("." + ZUUL_ROUTE + "/track/historical/" + date)
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        activeItem: date
                    });
                    this.props.setActiveSongList(result);
                },
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to load historical
                        songs for {date}:<br/>{errorMessage}</div>));
                }
            );
    };

    _isActive = (item) => this.state.activeItem === item;

    render() {
        return (<Menu vertical>
                <Menu.Item
                    name={SONGS}
                    active={this._isActive(SONGS)}
                    onClick={() => {
                        this.setState({
                            activeItem: SONGS
                        });
                        return this.props.setActiveSongList(this.props.songs);
                    }}
                >
                    Music
                </Menu.Item>
                <Dropdown item scrolling text='Historical plays'>
                    <Dropdown.Menu>
                        {this.props.historicalDates && this.props.historicalDates.map(hd =>
                            <Dropdown.Item text={hd}
                                           onClick={() => this.listHistoricalDates(hd)}
                                           key={hd}
                                           active={this._isActive(hd)}
                            />)
                        }
                    </Dropdown.Menu>
                </Dropdown>
                {this.props.shouldShowSyncButtons() &&
                    <Menu.Item>
                        Administrative
                        <Menu.Menu>
                            <Menu.Item
                                name={"Sync"}
                                onClick={() => this.props.performSync()}
                            >
                                Sync
                            </Menu.Item>
                            <Menu.Item
                                name={"Sync, forcing updates"}
                                onClick={() => this.props.performSync(true)}
                            >
                                Sync, forcing updates
                            </Menu.Item>
                        </Menu.Menu>
                    </Menu.Item>
                }
            </Menu>
        )
    }
}

export default NavigatorComponent;