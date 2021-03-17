import React, { useState, useRef, useEffect } from "react"
import { SafeAreaView, Platform, View, TouchableOpacity, StyleSheet, Modal, Image, ToastAndroid } from "react-native"
import { Camera } from "expo-camera"
import * as Permissions from "expo-permissions"
import * as MediaLibrary from "expo-media-library"
import Cabecalho from './components/Cabecalho/index'
import { Ionicons } from "@expo/vector-icons"

export default function App() {

  //status de acesso a camera
  const [temPermissao, setTemPermissao] = useState(null)
  //referencia da camera
  const cameraRef = useRef(null)
  //icone padrão exibido
  const [iconePadrao, setIconePadrao] = useState('md')//MD=material design
  //tipo da camera
  const [tipoCamera, setTipoCamera] = useState(Camera.Constants.Type.back)
  //status inicial do flash
  const [tipoFlash, setTipoFlash] = useState(Camera.Constants.FlashMode.off)
  //Foto Capiturada
  const [fotoCapiturada, setFotoCapiturada] = useState(null)
  //controle de exibição do modal
  const [exibeModal, setExibeModal] = useState(false)
  //status permição galeria
  const [temPermissaoGaleria, setTemPermissaoGaleria]=useState(null)

  useEffect(() => {
    //Dependendo do SO ecibiremos diferentes icones
    switch (Platform.OS) {
      case 'android': setIconePadrao('md')
        break
      case 'ios': setIconePadrao('ios')
        break
    }
  },[])

  useEffect(() => {//executa o conteudo no carregamento
    (async () => {
        if (Platform.OS === 'web') {
          const cameraDisponivel = await Camera.isAvailableAsync()
          setTemPermissao(cameraDisponivel)
        }
        else {
          const { status } = await Camera.requestPermissionsAsync()//granted
          setTemPermissao(status === 'granted')
        }
      }
    )();

    (async()=>{
      //solicita permissão na galeria de imagens
      const {status} = await Permissions.askAsync(Permissions.MEDIA_LIBRARY)
      setTemPermissaoGaleria(status==='granted')
    })();

  }, [])//Com o array vazio executa uma unica vez

  if (temPermissao === false) {
    return <Text>Acesso negado á camera ou seu equipamento não possui uma.</Text>
  }

  async function tirarFoto() {
    if (cameraRef) {
      const options = {
        quality: 0.5,
        skipProcessing: true
      }
      const foto = await cameraRef.current.takePictureAsync(options)
      setFotoCapiturada(foto.uri)
      setExibeModal(true)
      await obterResolucao()//Lista as resolções no console
      let mensagem  = "Foto capiturada com sucesso!"
      iconePadrao==='md'? ToastAndroid.showWithGravity(mensagem, ToastAndroid.SHORT, ToastAndroid.CENTER) : Alert.alert('Imagem capiturada', mensagem)
    }
  }
  async function salvarFoto(){
    if(temPermissaoGaleria){
      setExibeModal(false)
      const asset = await MediaLibrary.createAssetAsync(fotoCapiturada)
      await MediaLibrary.createAlbumAsync('Fatecam', asset, false)
    }
    else{
      Alert.alert('Sem permissão','Infelizmente')
    }
  }

  async function obterResolucao(){
    let resolucoes = await cameraRef.current.getAvailablePictureSizesAsync('16:9')
    console.log(`Resoluções suportadas: ${JSON.stringify(resolucoes)}`)
    if(resolucoes && resolucoes.length>0){
      console.log(`Maior qualidade: ${resolucoes[resolucoes.length - 1]}`)
      console.log(`Menor qualidade: ${resolucoes[0]}`)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Cabecalho titulo="FateCam" />
      <Camera
        styles={{ flex: 1 }}
        type={tipoCamera}
        flashMode={tipoFlash}
        ref={cameraRef}
      >
        <View style={styles.camera}>
          {/*Botao camera*/}
          <TouchableOpacity style={styles.touch} onPress={tirarFoto}>
            <Ionicons name={`${iconePadrao}-camera`} size={40} color="#9E9E9E" />
          </TouchableOpacity>

          {/*botao camera reversa */}
          <TouchableOpacity style={styles.touch} onPress={() => {
            setTipoCamera(tipoCamera === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back)
          }}>
            <Ionicons name={`${iconePadrao}-camera-reverse`} size={40} color="#9e9e9e" />
          </TouchableOpacity>

          {/*Botão traca flash*/}
          <TouchableOpacity style={styles.touch} onPress={() => {
            setTipoFlash(tipoFlash === Camera.Constants.FlashMode.on ? Camera.Constants.FlashMode.off : Camera.Constants.Type.on)
          }}>
            <Ionicons name={tipoFlash === Camera.Constants.FlashMode.on ?
              `${iconePadrao}-flash` : `${iconePadrao}-flash-off`} size={40} color="#9e9e9e" />
          </TouchableOpacity>

        </View>
      </Camera>
      <Modal animationType='slide'
        transparent={true}
        visible={exibeModal}>
        <View style={styles.ModalView}>
          <View style={{flexDirection:'row'}}>
            {/**Botão Salvar */}
            <TouchableOpacity style={{margin:2}} onPress={salvarFoto}>
              <Ionicons name={`${iconePadrao}-cloud-upload`} size={40} color='#121212'/>
            </TouchableOpacity>

            {/**Botão Fechar */}
            <TouchableOpacity onPress={()=>setExibeModal(false)}
            accessible={true}
            accessibilityLabel='Fechar'
            accessibilityHint='Fecha a janela atual'>
              <Ionicons name={`${iconePadrao}-close-circle`} size={40} color='#d9534f' />
            </TouchableOpacity>
          </View>
          <Image source={{ uri: fotoCapiturada }}
            style={{ width: '90%', height: '50%', borderRadius: 20 }} />
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center"
  },
  camera: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: "flex-end"
  },
  touch: {
    margin: 20
  },
  ModalView: {
    margin: 10,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    opacity: 0.9,
    alignItems: "center"
  }
})