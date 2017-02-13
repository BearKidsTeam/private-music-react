import React from "react";
import ReactDOM from 'react-dom';
import { Row,Col,Button,Checkbox,Layout, Menu, Icon, Table, Slider, Modal, Input } from 'antd';
import axios from 'axios';

const { Header, Content, Footer, Sider } = Layout;
const SubMenu = Menu.SubMenu;
const ButtonGroup = Button.Group;

const columns = [{
    title: 'File Name',
    dataIndex: 'fileName',
    key: 'fileName',
    render: text => <a href="#">{text}</a>,
}];

function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.round(t - Math.floor(t / 60) * 60);
    if (s < 10) {
        return m + ":0" + s;
    }
    else if (s === 60) {
        return (m + 1) + ":00";
    }
    else {
        return m + ":" + s;
    }
}

class Player extends React.Component {
    audio = null;
    currentFolder = '';
    pagination = {
        total: 0,
        showSizeChanger: true
    };
    state = {
        playing:'',
        loop: false,
        order: false,
        playIcon: 'caret-right',
        curTime: 0,
        totTime: 0,
        data: [],
        fdlist: [],
        collapsed: false,
        source: 'http://direct.blumia.cn/hidden',
        newSource: 'http://direct.blumia.cn/hidden',
        settingsVisible: false
    };
    onCollapse = (collapsed) => {
        this.setState({ collapsed });
    };
    init = () => {
        this.audio = document.getElementsByTagName('audio')[0];
        this.fetchPlaylist();
        this.audio.ontimeupdate = () => {
            this.setState({curTime: this.audio.currentTime, totTime: this.audio.duration});
        };
        this.audio.onpause = () => {
            this.setState({playIcon: 'caret-right'});
        }
        this.audio.onplay = () => {
            this.setState({playIcon: 'pause'});
        }
    };
    fetchPlaylist = () => {
        axios({method: 'POST', url: this.state.source + '/api.php',data:'do=getplaylist&folder=/', headers:{'Content-Type':'application/x-www-form-urlencoded'}})
        .then((response) => {
            this.setState({fdlist: response.data.result.data.subFolderList.map(x => decodeURIComponent(x))});
        }).catch(() => {});
    };
    fetchMusic = (folder) => {
        axios({method: 'POST', url: this.state.source + '/api.php',data:'do=getplaylist&folder=' + folder, headers:{'Content-Type':'application/x-www-form-urlencoded'}})
        .then((response) => {
            this.pagination =  {
                total: response.data.result.data.musicList.length,
                showSizeChanger: true
            } 
            this.setState({data: response.data.result.data.musicList.map(x=> { x.fileName = decodeURIComponent(x.fileName); return x})});
        }).catch(() => {});

    };
    onMenuClick = ({item, key, keyPath}) => {
        if (key === 'settings') {
            this.setState({settingsVisible : true, newRandomKey: Math.random()});
            return;
        }
        if (key !== 'settings' && this.state.collapsed) {
            this.setState({collapsed:false});
        }
        this.currentFolder = key;
        this.fetchMusic(key);
    };
    componentDidMount() {
        this.init();
    };
    playAtIndex = (i) => {
        const filename = this.state.data[i].fileName;
        this.audio.pause();
        this.audio.src = this.state.source + this.currentFolder + '/' + filename;
        this.audio.load();
        this.audio.oncanplay = () => {
            this.audio.play();
            this.setState({playing: filename});
        }   
    };
    onRowClick = (record,index) => {
        this.audio.pause();
        this.audio.src = this.state.source + this.currentFolder + '/' + record.fileName;
        this.audio.load();
        this.audio.play();
        this.setState({playing: record.fileName});
    };
    onPlayClick = () => {
        if(this.state.playIcon === 'pause') {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    };
    onPrevClick = () => {
        const currentIndex = this.state.data.findIndex(x => x.fileName === this.state.playing);
        if (currentIndex === -1) {
            this.playAtIndex(0);
        } else if (currentIndex === 0) {
            this.playAtIndex(this.state.data.length - 1);
        } else {
            this.playAtIndex(Number(currentIndex) - 1);
        }
    };
    onNextClick = () => {
        const currentIndex = this.state.data.findIndex(x => x.fileName === this.state.playing);
        if (currentIndex === -1) {
            this.playAtIndex(0);
        } else if (currentIndex === (this.state.data.length - 1)) {
            this.playAtIndex(0);
        } else {
            this.playAtIndex(Number(currentIndex) + 1);
        }
    };
    onLoopChange = (value) => {
        if (value.target.checked) {
            this.audio.loop = true;
        } else {
            this.audio.loop = false;
        }
    };
    onOrderChange = (value) => {
        if (value.target.checked) {
            this.audio.onended = () => {
                if (this.audio.loop === 0) {
                    this.onNextClick();
                }
            };
        } else {
            this.audio.onended = undefined;
        }
    };
    onSettingsOk = () => {
        this.setState({source: this.state.newSource,settingsVisible:false});
        this.init();
    };
    onSettingsCancel = () => {
        this.setState({settingsVisible: false,newSource: this.state.source});
    };
    onChange = (event) => {
        this.setState({newSource: event.target.value});
    };
    onProgressChange = (value) => {
        this.audio.currentTime = value;
        this.setState({curTime: value});
    };
    onAfterChange = (value) => {
        this.audio.currentTime = value;
        this.setState({curTime: value});
    };
    render() {
        return (
            <div style={{ height: '100%' }}>
                <audio></audio>
                <Layout style={{ height: '100%' }}>
                    <Layout style={{ height: '100%' }}>
                        <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse} style={{ height: '100%' }}>
                            <Menu theme="dark" mode="inline" openKeys={['sub1']} selectedKeys={this.state.collapsed ? [] : [this.currentFolder]} style={{ height: '100%' }} onClick={this.onMenuClick}>
                                { !this.state.collapsed  && 
                                    <SubMenu key="sub1" title={<span><Icon type="folder" /><span>Folder List</span></span>}>
                                        {this.state.fdlist.map(x => <Menu.Item key={x}>{x}</Menu.Item>)}
                                    </SubMenu>
                                }
                                { this.state.collapsed &&
                                    <Menu.Item key="1">
                                        <Icon type="folder"/>
                                    </Menu.Item>
                                }
                                <Menu.Item key="settings">
                                    <Icon type="setting" /> { !this.state.collapsed && 'Settings' }
                                </Menu.Item>
                            </Menu>
                        </Sider>
                        <Layout style={{ background: '#fff' }}>
                            <Content style={{ margin: '0px' }}>
                                <Table dataSource={this.state.data} columns={columns} style={{ background: '#fff' }} showHeader={false} pagination={this.pagination} onRowClick = {this.onRowClick}/>
                            </Content>
                        </Layout>
                    </Layout>
                    <Footer style={{ textAlign: 'center', background: '#494949', paddingLeft:0, paddingRight:0 }}>
                        <Layout style={{background: '#494949'}}>
                            <Sider style={{background: '#494949', color:'#fff'}}>
                                <Row type="flex" justify="space-around" align="middle" style={{height: '100%'}}>
                                    <Col span={24}>
                                        {this.state.playing}
                                    </Col>
                                </Row>
                            </Sider>
                            <Content style={{paddingLeft:0,paddingRight:0}}>
                                <Row type="flex" justify="space-around" align="middle">
                                    <Col style={{ width:30, color:'#fff' }}> {formatTime(this.state.curTime)} </Col>
                                    <Col style={{ width:'calc(100% - 340px)', padding:5 }}>
                                        <Slider value={this.state.curTime} min={0} max={this.state.totTime} step={1} onChange={this.onProgressChange} tipFormatter={formatTime} style={{ borderTop:'4px solid #494949', borderBottom:'4px solid #494949' }} />
                                    </Col>
                                    <Col style={{ width:30, color:'#fff' }}> {formatTime(this.state.totTime)} </Col>
                                    <Col style={{ overflowY:'hidden', width:280, display:'block' }}>
                                        <ButtonGroup>
                                            <Button type="primary" size='large' icon="step-backward" onClick={this.onPrevClick}/>
                                            <Button type="primary" size='large' icon={this.state.playIcon} onClick={this.onPlayClick} />
                                            <Button type="primary" size='large' icon="step-forward" onClick={this.onNextClick}/>
                                        </ButtonGroup>
                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                        <Checkbox style={{ color:'#fff' }} onChange={this.onLoopChange}>Loop</Checkbox>
                                        <Checkbox style={{ color:'#fff' }} onChange={this.onOrderChange}>Order</Checkbox>
                                    </Col>
                                </Row>
                            </Content>
                        </Layout>
                    </Footer>
                </Layout>
                <Modal title="Settings" key={this.state.newRandomKey} visible={this.state.settingsVisible}
                    onOk={this.onSettingsOk} onCancel={this.onSettingsCancel}>
                    <Input addonBefore={'PCM Source'} defaultValue={this.state.source} value={this.state.newSource} onChange={this.onChange} />
                </Modal>
            </div>
        );
    }
}

export default Player;