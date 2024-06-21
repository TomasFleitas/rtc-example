import { Button, Form, Image, Input } from 'antd';
import { memo, useRef, useState } from 'react';
import WebRTC from '@ewents/rtc';
import style from './index.module.scss';
import { useParams } from 'react-router-dom';

export const Connect = memo(() => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [hostStream, setHostStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [counting, setCounting] = useState(0);
  const [fileSrc, setImageSrc] = useState<string>();

  const { id } = useParams();
  const webRTC = useRef(
    new WebRTC({
      baseUrl: 'ws://localhost:3001',
      peerId: id,
      onReceiveData: (message) => {
        if (message.type !== 'counting') {
          console.log(message);
          setMessages((prev) => [...prev, message]);
        } else {
          setCounting(message.count);
        }
      },
      onReceiveFile: ({ fileName, percentage, file }) => {
        fileName && setFileName(fileName);
        console.log(`Received file: ${fileName}, ${percentage}`, file);
        console.log(file?.type);
        if (file?.type.startsWith('image/')) {
          const imageUrl = URL.createObjectURL(file);
          setImageSrc(imageUrl);
        }
      },
      onReceiveMediaStream: ({ type, stream }) => {
        if (type === 'host') {
          setHostStream(stream[0]);
        } else if (type === 'remote') {
          setRemoteStream(stream[0]);
        }
      },
    }),
  );
  

  const [form] = Form.useForm();

  const onSubmit = ({ peerId }) => webRTC.current.startConnection(peerId);

  /* webRTC.current.startConnection("2") */

  webRTC.current.onConnectionStateChange((state) =>
    setConnected(state === 'connected'),
  );

  const handleSendMessage = (value) => {
    webRTC.current.sendData(value.target.value);
    setMessages((prev) => [...prev, value.target.value]);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      webRTC.current.sendFile(file);
    }
  };

  const startVideoWithAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    if (videoTrack) {
      webRTC.current.setMediaTrack(videoTrack, stream);
    }
    if (audioTrack) {
      webRTC.current.setMediaTrack(audioTrack, stream);
    }
  };

  const startVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      webRTC.current.setMediaTrack(videoTrack, stream);
    }
  };

  const startAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      webRTC.current.setMediaTrack(audioTrack, stream);
    }
  };

  const stopVideo = () => {
    webRTC.current.getMediaTrack('video').enabled =
      !webRTC.current.getMediaTrack('video').enabled;
  };

  const stopAudio = () => {
    webRTC.current.getMediaTrack('audio').enabled =
      !webRTC.current.getMediaTrack('audio').enabled;
  };

  const startCount = () => {
    let count = 0;
    setInterval(() => {
      webRTC.current.sendData({ type: 'counting', count });
      count++;
    }, 1000);
  };

  return (
    <div className={style.form}>
      <h1>{counting}</h1>
      {connected && (
        <Button danger onClick={() => webRTC.current.closeConnection()}>
          DISCONNECT
        </Button>
      )}
      {!connected && (
        <Form layout="vertical" form={form} onFinish={onSubmit}>
          <Form.Item name="peerId" label="Peer">
            <Input />
          </Form.Item>
          <Button htmlType="submit">CONNECT</Button>
        </Form>
      )}
      {connected && (
        <div>
          <div style={{ width: 300 }}>
            <Input
              onChange={handleSendMessage}
              placeholder="Type a message..."
            />
          </div>
          <div className={style.messages}>
            {messages.map((message, index) => (
              <div key={index} className={style.message}>
                {message}
              </div>
            ))}
          </div>
          <div className={style.fileInput}>
            <input type="file" id="fileInput" onChange={handleFileChange} />
            <label htmlFor="fileInput">Choose a file</label>
          </div>
          <div className={style.mediaControls}>
            <Button onClick={startCount}>Start Count</Button>
            <Button onClick={startVideoWithAudio}>
              Start Video with Audio
            </Button>
            <Button onClick={startVideo}>Start Video</Button>
            <Button onClick={stopVideo}>Stop Video</Button>
            <Button onClick={startAudio}>Start Audio</Button>
            <Button onClick={stopAudio}>Stop Audio</Button>
          </div>
          <div className={style.videoContainers}>
            {hostStream && (
              <div className={style.videoContainer}>
                <video
                  autoPlay
                  controls
                  ref={(video) => {
                    if (video) {
                      video.srcObject = hostStream;
                    }
                  }}
                />
              </div>
            )}
            {remoteStream && (
              <div className={style.videoContainer}>
                <video
                  autoPlay
                  controls
                  ref={(video) => {
                    if (video) {
                      video.srcObject = remoteStream;
                    }
                  }}
                />
              </div>
            )}
          </div>
          {fileName && (
            <div className={style.fileName}>Received file: {fileName}</div>
          )}
          {fileSrc && <Image src={fileSrc} />}
        </div>
      )}
    </div>
  );
});
