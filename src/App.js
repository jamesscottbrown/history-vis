/*global browser*/
import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import {loadHistory, constructTree, constructTree2} from './loadHistory.js'

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <h1>History Tree</h1>
      </header>


        <p>
          A diagram will appear here.
        </p>

          <HistoryTable></HistoryTable>

    </div>
  );
//});

}

const historyRow = props =>
    <ul>
        <li>{props.url}</li>
        {props.children ? props.children.map(child => historyRow(child)) : ''}
    </ul>;


class HistoryTable extends Component {
    constructor(props) {
        super(props);
        this.state = {historyTree: []};
    }

    componentDidMount() {
        loadHistory().then(d => {
            this.setState({historyTree: constructTree2(d.allVisits, d.links)});
            //this.render();
        });
    }

    render(){
        return <div id='historyTable'>
            <h3>History</h3>
            <ul>
                {console.log(`Rendering State: ${JSON.stringify(this.state)}`)}

                {this.state.historyTree.map( historyItem => historyRow(historyItem))}

            </ul>
        </div>
    }
}


export default App;
