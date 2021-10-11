import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import contractABI from "./utils/WavePortal.json";
import * as md5 from 'md5';

const contractAddress = "0x6Aa152A7725CaeE892CC7Deca4C144b32BC389Ee";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [waveMessage, setWaveMessage] = useState("Write something here!");
  const [allWaves, setAllWaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  const checkCorrectNetwork = async () => {
    const {ethereum} = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4"; 
    if (chainId !== rinkebyChainId) {
      setWrongNetwork(true);
      alert("You are not connected to the Rinkeby Test Network!");
      return;
    }
    setWrongNetwork(false);
  }
  const checkIfConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.error("No web3 provider");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found account: ", account);
      setCurrentAccount(account);
    } else {
      console.error("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("No web3 provider");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected:", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("No web3 provider");
        return;
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        provider
      );

      let waves = await wavePortalContract.getAllWaves();

      let wavesCleaned = [];
      waves.forEach(wave => {
        wavesCleaned.push({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message
        });
      });

      wavesCleaned.sort((a,b) => b.timestamp - a.timestamp )

      wavePortalContract.on("NewWave", (from, timestamp, message) => {
        console.log("NewWave", from, timestamp, message);

        setAllWaves(prevState => [{
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message
        },...prevState]);
      });
      
      console.log("Waves:", waves);
      setAllWaves(wavesCleaned);
    } catch (e) {
      console.error(e);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("No web3 provider");
        return;
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      let count = await wavePortalContract.getTotalWaves();
      console.log("TOTAL WAVES: ", count.toNumber());
      setLoading(true);
      let waveTx = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
      console.log("Minig...");

      await waveTx.wait();
      setLoading(false);
      count = await wavePortalContract.getTotalWaves();
      console.log("New wave count:", count.toNumber());
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  };

  useEffect(() => {
    checkIfConnected();
    checkCorrectNetwork();
    getAllWaves();
  }, []);

  const updateWaveMessage = (e) => {
    setWaveMessage(e.nativeEvent.target.value);
  };

  return (
    <div className="mainContainer text-gray-300">
      <div className="dataContainer">
        <div className="flex flex-col">
        <div className="header text-center w-full">
          <h1 className="font-bold text-4xl">Ahoy!</h1>
        </div>
        <div className="w-full">
        <div className="bio">
          <p>I am @hjeldin, say hello and spend 50$ to post your message on
          the blockchain...forever!
          </p>
          <p>
          Also, win 0.001 rETH if the odds are in your favour.
          </p>
          <p>Last but not least, <u>we speak HTML</u>! <br />(Yep, that's completely insecure...smash everything 🤪 )</p>
        </div>
        {
          !wrongNetwork ? (
            !loading ? (
              <div className="flex flex-col">
                <textarea
                  placeholder={waveMessage}
                  onChange={updateWaveMessage}
                  className="waveMessage text-gray-700"
                ></textarea>
                <button
                  disabled={waveMessage == "Write something here!"}
                  className="bg-gray-300 text-blue-500 rounded rounded-lg my-8 py-2 hover:bg-blue-200"
                  onClick={wave}
                >
                  👋 Say something nice 👋
                </button>
              </div>
            ) : (
              <img src='https://c.tenor.com/isiLRnxz3zwAAAAC/cat-driving-serious.gif' />
            )
          ) : (
            <b>Wrong network selected!</b>
          )
        }
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect wallet
          </button>
        )}
        </div>
        </div>

        {allWaves.map((wave, index) => {
          return (
            <div key={index} className="first:my-12 my-2 p-8 bg-gray-700 text-white flex flex-col rounded rounded-sm">
              <div className="flex justify-start items-center gap-4">
                <div><img className="rounded rounded-full" src={'https://i.pravatar.cc/150?u='+(wave.address)} width="80"/></div>
                <div>
                  <p>{wave.address}</p>
                  <p>{wave.timestamp.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-8" dangerouslySetInnerHTML={{__html:wave.message}}></div>
            </div>)
        })}
      </div>
    </div>
  );
}
