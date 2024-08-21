import { useEffect, useRef, useState } from 'react';
import style from './index.module.scss';
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputRef,
  notification,
  Row,
  Switch,
} from 'antd';
import WebRTC from 'ewents-rtc';
import {
  FileAddOutlined,
  SendOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PoweroffOutlined,
  PhoneOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { CopyOutlined } from '@ant-design/icons';

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
        muted
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

const orchestratorUrl = import.meta.env.VITE_APP_BACKEND_URL;

export const Chat = () => {
  const [form] = Form.useForm();
  const [isSecure, setIsSecure] = useState(false);
  const [rtc, setRTC] = useState<WebRTC>();
  const [secureCodeValue, setSecureCode] = useState<string | undefined>();
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
  const [lvl, setLvl] = useState<any>();

  const login = async ({ id, peerId, secureCode: secureCodeFrom }) => {
    const webRTC = new WebRTC({
      clientKey: '66760d2b14813c0e8b53b4ff',
      orchestratorUrl,
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
      onCommunicationState: (connectionState) => {
        setConnecting(connectionState === 'connecting');
        const isConencted = ['weak', 'full'].includes(connectionState);
        setLvl(connectionState);
        setConnected(isConencted);
        if (connectionState === 'none') {
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

    setRTC(webRTC);

    const secureCode = await webRTC
      .startConnection(peerId, {
        callback: setSecureCode,
        secureCode: secureCodeFrom,
        peerId: id,
        isSecure,
        isLog: true,
      })
      .catch(({ reason }) => {
        notification.error({ message: reason });
        return undefined;
      });

    setSecureCode(secureCode);
    form.setFieldValue('secureCode', secureCode);
  };

  const closeConnection = () => {
    rtc.closeConnection();
    cleanData();
  };

  const cleanData = () => {
    hostStream?.getTracks().forEach((track) => track.stop());
    setMessages([]);
    form.resetFields();
    setRTC(undefined);
    setSecureCode(undefined);
    setRemoteStream(undefined);
    setHostStream(undefined);
    setConnecting(false);
  };

  const sendMessage = async ({ message }) => {
    if (message?.length) {
      form.resetFields();
      setMessages((prev) => [...prev, { type: 'host', message }]);
      rtc.sendData({ type: 'remote', message }, console.log).then(console.log);
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
          <Card>
            <div
              style={{
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Switch
                unCheckedChildren={'Not Secure'}
                checkedChildren={'Secure'}
                checked={isSecure}
                onChange={setIsSecure}
              />
            </div>

            <Form layout="vertical" form={form} onFinish={login}>
              <Form.Item
                label="Identifier"
                name="id"
                rules={[{ required: true, message: 'Identifier is required.' }]}
              >
                <Input maxLength={10} showCount />
              </Form.Item>
              <Form.Item
                label="Peer Identifier"
                name="peerId"
                rules={[
                  { required: true, message: 'Peer Identifier is required.' },
                ]}
              >
                <Input maxLength={10} showCount />
              </Form.Item>

              {isSecure && (
                <Form.Item label="Secure Code" name="secureCode">
                  <Input
                    value={secureCodeValue}
                    suffix={
                      (secureCodeValue && (
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(secureCodeValue).then(
                              () => {
                                notification.success({
                                  message: 'Copied to clipboard!',
                                });
                              },
                              () => {
                                notification.error({
                                  message: 'Error',
                                });
                              },
                            );
                          }}
                        />
                      )) || <></>
                    }
                  />
                </Form.Item>
              )}
              <Row gutter={8}>
                <Col span={connecting ? 18 : 24}>
                  <Button
                    htmlType="submit"
                    className={style.button}
                    loading={connecting}
                  >
                    {connecting ? 'Waiting for peer' : 'Connect'}
                  </Button>
                </Col>
                {connecting && (
                  <Col span={6}>
                    <Button
                      htmlType="button"
                      onClick={closeConnection}
                      className={style.closeButton}
                      danger
                      icon={<CloseCircleOutlined />}
                    />
                  </Col>
                )}
              </Row>
            </Form>
          </Card>
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

            <Form form={form} onFinish={sendMessage}>
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
                      {lvl === 'full' && (
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
                      )}
                      <Col span={12}>
                        <Button icon={<SendOutlined />} htmlType="submit" />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
          </div>
          {lvl === 'full' && (
            <div className={style.call}>
              <Cameras hostStream={hostStream} remoteStream={remoteStream} />
              <div className={style.controllers}>
                {isCall && (
                  <>
                    <Button
                      icon={
                        videoOn ? <EyeOutlined /> : <EyeInvisibleOutlined />
                      }
                      onClick={toggleVideo}
                    />
                    <Button
                      icon={
                        audioOn ? <AudioOutlined /> : <AudioMutedOutlined />
                      }
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
          )}
        </div>
      )}
    </div>
  );
};
