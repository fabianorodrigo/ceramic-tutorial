import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import {Web3Provider} from "@ethersproject/providers";
import {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import {useViewerRecord} from "@self.id/react";

// React Hook provided to us by the Self.ID SDK. Self.ID provides a hook called
// useViewerConnection which gives us an easy way to connect and disconnect to the Ceramic Network
import {useViewerConnection} from "@self.id/react";
// takes an Ethereum provider and an address as an argument, and uses it to connect your Ethereum wallet to your 3ID.
import {EthereumAuthProvider} from "@self.id/web";

// In the top right of the page, we conditionally render a button Connect that connects you to SelfID, or if you
// are already connected, it just says Connected. Then, in the main body of the page, if you are connected, we
// display your 3ID, and render a component called RecordSetter.
// If you are not connected, we render some text asking you to connect your wallet first.
export default function Home() {
  // create a reference using the useRef react hook to a Web3Modal instance
  const web3ModalRef = useRef();
  // helper function to get the Provider. This function will prompt the user to
  // connect their Ethereum wallet, if not already connected, and then return a Web3Provider.
  const getProvider = async () => {
    const provider = await web3ModalRef.current.connect();
    const wrappedProvider = new Web3Provider(provider);
    return wrappedProvider;
  };

  const [connection, connect, disconnect] = useViewerConnection();

  useEffect(() => {
    if (connection.status !== "connected") {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }
  }, [connection.status]);

  //  takes the Ethereum Auth Provider, and calls the connect function that we got from the useViewerConnection
  // hook which takes care of everything else for us.
  const connectToSelfID = async () => {
    const ethereumAuthProvider = await getEthereumAuthProvider();
    connect(ethereumAuthProvider);
  };

  const getEthereumAuthProvider = async () => {
    const wrappedProvider = await getProvider();
    const signer = wrappedProvider.getSigner();
    const address = await signer.getAddress();
    // You may be wondering why we are passing it wrappedProvider.provider instead of wrappedProvider directly.
    // It's because ethers abstracts away the low level provider calls with helper functions so it's easier for
    // developers to use, but since not everyone uses ethers.js, Self.ID maintains a generic interface to actual
    // provider specification, instead of the ethers wrapped version. We can access the actual provider instance
    // through the provider property on wrappedProvider.
    return new EthereumAuthProvider(wrappedProvider.provider, address);
  };

  return (
    <div className={styles.main}>
      <div className={styles.navbar}>
        <span className={styles.title}>Ceramic Demo</span>
        {connection.status === "connected" ? (
          <span className={styles.subtitle}>Connected</span>
        ) : (
          <button
            onClick={connectToSelfID}
            className={styles.button}
            disabled={connection.status === "connecting"}
          >
            Connect
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.connection}>
          {connection.status === "connected" ? (
            <div>
              <span className={styles.subtitle}>
                Your 3ID is {connection.selfID.id}
              </span>
              <RecordSetter />
            </div>
          ) : (
            <span className={styles.subtitle}>
              Connect with your wallet to access your 3ID
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordSetter() {
  const record = useViewerRecord("basicProfile");

  const updateRecordName = async (name) => {
    await record.merge({
      name: name,
    });
  };

  const [name, setName] = useState("");

  return (
    <div className={styles.content}>
      <div className={styles.mt2}>
        {record.content ? (
          <div className={styles.flexCol}>
            <span className={styles.subtitle}>
              Hello {record.content.name}!
            </span>

            <span>
              The above name was loaded from Ceramic Network. Try updating it
              below.
            </span>
          </div>
        ) : (
          <span>
            You do not have a profile record attached to your 3ID. Create a
            basic profile by setting a name below.
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.mt2}
      />
      <button onClick={() => updateRecordName(name)}>Update</button>
    </div>
  );
}
