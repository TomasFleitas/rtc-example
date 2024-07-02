import { useEffect, useRef, useState } from 'react';
import style from './index.module.scss';
import { Button, Col, Form, Image, Input, InputRef, Row } from 'antd';
import WebRTC from '@ewents/rtc';
import {
  FileAddOutlined,
  SendOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PoweroffOutlined,
  PhoneOutlined,
} from '@ant-design/icons';

const scrollToBottom = (div: HTMLHtmlElement) => {
  if (div) {
    div.scrollTop = div.scrollHeight;
  }
};

const Cameras = ({ hostStream, remoteStream }) => (
  <div>
    <div className={style['call-host']}>
      <video
        autoPlay
        ref={(video) => {
          if (video) {
            video.srcObject = hostStream;
          }
        }}
      />
    </div>
    <div className={style['call-remote']}>
      <video
        autoPlay
        ref={(video) => {
          if (video) {
            video.srcObject = remoteStream;
          }
        }}
      />
    </div>
  </div>
);

export const Chat = () => {
  const [from] = Form.useForm();
  const [rtc, setRTC] = useState<WebRTC>();
  const input = useRef<InputRef>();
  const [messages, setMessages] = useState<
    {
      type: 'remote' | 'host' | 'image-host' | 'image-remote';
      message: string;
    }[]
  >([]);
  const chat = useRef();
  const [hostStream, setHostStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isCall, initCall] = useState(false);
  const [videoOn, setVideo] = useState(true);
  const [audioOn, setAudio] = useState(true);

  const login = ({ id, peerId }) => {
    setConnecting(true);
    const webRTC = new WebRTC({
      clientKey: '66760d2b14813c0e8b53b4ff',
      peerId: id,
      onReceiveData: (message) => setMessages((prev) => [...prev, message]),
      onReceiveFile: ({ fileName, percentage, file }) => {
        console.log(`Received file: ${fileName}, ${percentage}`, file);
        if (file?.type.startsWith('image/')) {
          const imageUrl = URL.createObjectURL(file);
          setMessages((prev) => [
            ...prev,
            { type: 'image-remote', message: imageUrl },
          ]);
        }
      },
      onConnectionStateChange: (state) => {
        const isConencted = state === 'connected';
        setConnected(isConencted);
        if (state === 'closed') {
          setConnecting(false);
          cleanData();
        }
      },
      onReceiveMediaStream: (stream) => {
        setRemoteStream(stream);

        stream.getVideoTracks()[0].onmute = () => {
          setRemoteStream(undefined);
        };
      },
    });

    webRTC.startConnection(peerId);

    setRTC(webRTC);
  };

  const closeConnection = () => {
    rtc.closeConnection();
    cleanData();
  };

  const cleanData = () => {
    setMessages([]);
    setRTC(undefined);
    setRemoteStream(undefined);
    setHostStream(undefined);
    setConnecting(false);
  };

  const sendMessage = async ({ message }) => {
    if (message?.length) {
      from.resetFields();
      setMessages((prev) => [...prev, { type: 'host', message }]);
      rtc.sendData({ type: 'remote', message });
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0] as File;
    if (file) {
      rtc.sendFile(file, console.log);
      const imageUrl = URL.createObjectURL(file);
      setMessages((prev) => [
        ...prev,
        { type: 'image-host', message: imageUrl },
      ]);
    }
  };

  useEffect(() => {
    const handleKeyDown = () => {
      if (input.current && document.activeElement !== input.current.input) {
        input.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    scrollToBottom(chat.current);
  }, [messages.length]);

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    rtc.setMediaTracks({ audioTrack, videoTrack }, stream, console.log);
    initCall(true);
    setHostStream(stream);
  };

  const toggleVideo = () => {
    rtc.getMediaTrack('video').enabled = !rtc.getMediaTrack('video').enabled;
    setVideo(rtc.getMediaTrack('video').enabled);
  };

  const toggleAudio = () => {
    rtc.getMediaTrack('audio').enabled = !rtc.getMediaTrack('audio').enabled;
    setAudio(rtc.getMediaTrack('audio').enabled);
  };

  const hangOff = () => {
    hostStream.getTracks().forEach((track) => track.stop());
    rtc.removeMediaTrack('audio');
    rtc.removeMediaTrack('video');
    initCall(false);
    setHostStream(undefined);
    setVideo(true);
    setAudio(true);
  };

  return (
    <div className={style.chat}>
      {(!connected && (
        <div className={style.login}>
          <Form layout="vertical" form={from} onFinish={login}>
            <Form.Item
              label="Identifier"
              name="id"
              rules={[{ required: true }]}
            >
              <Input maxLength={10} showCount />
            </Form.Item>
            <Form.Item
              label="Peer Identifier"
              name="peerId"
              rules={[{ required: true }]}
            >
              <Input maxLength={10} showCount />
            </Form.Item>

            <Button
              htmlType="submit"
              className={style.button}
              loading={connecting}
            >
              {connecting ? 'Waiting for peer' : 'Connect'}
            </Button>
          </Form>
        </div>
      )) || (
        <div className={style.content}>
          <div>
            <Button danger onClick={closeConnection}>
              Disconnect
            </Button>
            <div ref={chat} className={style['chat-content']}>
              {messages.map(({ type, message }, index) => {
                if (type.match('image')) {
                  return (
                    <div className={style[type]}>
                      <Image
                        onLoad={() => scrollToBottom(chat.current)}
                        src={message}
                      />
                    </div>
                  );
                }

                return (
                  <div key={index} className={style['message-' + type]}>
                    {message}
                  </div>
                );
              })}
            </div>

            <Form form={from} onFinish={sendMessage}>
              <Form.Item name="message" style={{ margin: 0 }}>
                <Row gutter={10}>
                  <Col span={18}>
                    <Input
                      ref={input}
                      placeholder="Message..."
                      maxLength={200}
                      showCount
                      required
                    />
                  </Col>
                  <Col span={6}>
                    <Row>
                      <Col span={12}>
                        <input
                          type="file"
                          accept=".png,.jpeg,.jpg"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          id="fileInput"
                        />
                        <Button
                          htmlType="button"
                          icon={<FileAddOutlined />}
                          onClick={() =>
                            document.getElementById('fileInput').click()
                          }
                        />
                      </Col>
                      <Col span={12}>
                        <Button icon={<SendOutlined />} htmlType="submit" />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
          </div>
          <div className={style.call}>
            <Cameras hostStream={hostStream} remoteStream={remoteStream} />
            <div className={style.controllers}>
              {isCall && (
                <>
                  <Button
                    icon={videoOn ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    onClick={toggleVideo}
                  />
                  <Button
                    icon={audioOn ? <AudioOutlined /> : <AudioMutedOutlined />}
                    onClick={toggleAudio}
                  />
                </>
              )}
              <Button
                icon={!isCall ? <PhoneOutlined /> : <PoweroffOutlined />}
                onClick={() => (!isCall ? startCall() : hangOff())}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
