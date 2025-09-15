import './App.css';
import { Router, Route } from "@solidjs/router";
import Home from './views/Home';
import Roaming from './views/Roaming';
import RoomMgr from './views/RoomMgr';
import Guard from './views/Guard';
import Lock from './views/Lock';
import Share from './views/Share';
import PrivShare from './views/PrivShare';

function App() {
  return ( 
    <Router>
      <Route path="/" component={Home} />
      <Route path="/lock" component={Lock} />
      <Route path="/share" component={Share} />
      <Route path="/priv_share" component={PrivShare} />
      <Route path="/chat/*" component={Guard} />
      <Route path="/roam" component={Roaming} />
      <Route path="/room/:id?" component={RoomMgr} />
    </Router>
  );
}
export default App;
